--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (02a153c)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: check_production_health(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.check_production_health() RETURNS TABLE(check_name text, status text, details text, action_required text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    orphaned_count INTEGER;
    large_table_size BIGINT;
    active_conn_count INTEGER;
BEGIN
    -- Check for orphaned records across all tables
    SELECT COUNT(*) INTO orphaned_count
    FROM (
        SELECT tenant_id FROM customers WHERE tenant_id NOT IN (SELECT id FROM tenants)
        UNION ALL
        SELECT tenant_id FROM loan_books WHERE tenant_id NOT IN (SELECT id FROM tenants)
        UNION ALL
        SELECT tenant_id FROM users WHERE tenant_id NOT IN (SELECT id FROM tenants)
        -- Add more tables as needed
    ) orphaned;
    
    RETURN QUERY SELECT 
        'orphaned_records'::TEXT,
        CASE WHEN orphaned_count = 0 THEN 'HEALTHY' ELSE 'ALERT' END::TEXT,
        ('Found ' || orphaned_count || ' orphaned records')::TEXT,
        CASE WHEN orphaned_count > 0 THEN 'Run cleanup_tenant_data() function' ELSE 'No action needed' END::TEXT;
    
    -- Check for oversized tables
    SELECT MAX(pg_total_relation_size(oid)) INTO large_table_size
    FROM pg_class WHERE relkind = 'r';
    
    RETURN QUERY SELECT 
        'table_size_check'::TEXT,
        CASE WHEN large_table_size > 100 * 1024 * 1024 THEN 'WARNING' ELSE 'HEALTHY' END::TEXT,
        ('Largest table size: ' || pg_size_pretty(large_table_size))::TEXT,
        CASE WHEN large_table_size > 100 * 1024 * 1024 THEN 'Consider data archiving or partitioning' ELSE 'No action needed' END::TEXT;
    
    -- Check active connections
    SELECT COUNT(*) INTO active_conn_count FROM pg_stat_activity WHERE state = 'active';
    
    RETURN QUERY SELECT 
        'connection_health'::TEXT,
        CASE WHEN active_conn_count > 20 THEN 'WARNING' ELSE 'HEALTHY' END::TEXT,
        ('Active connections: ' || active_conn_count)::TEXT,
        CASE WHEN active_conn_count > 20 THEN 'Review connection pooling settings' ELSE 'No action needed' END::TEXT;
    
    -- Check RLS is enabled on critical tables
    RETURN QUERY SELECT 
        'row_level_security'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'CRITICAL' ELSE 'HEALTHY' END::TEXT,
        ('Tables without RLS: ' || COALESCE(STRING_AGG(tablename, ', '), 'None'))::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'Enable RLS on all multi-tenant tables' ELSE 'All tables properly secured' END::TEXT
    FROM pg_tables 
    WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'loan_books', 'users', 'assets', 'liabilities')
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = pg_tables.tablename
        );
END;
$$;


ALTER FUNCTION public.check_production_health() OWNER TO neondb_owner;

--
-- Name: cleanup_tenant_data(character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.cleanup_tenant_data(tenant_id_to_delete character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Log the cleanup operation
    RAISE NOTICE 'Starting cleanup for tenant: %', tenant_id_to_delete;
    
    -- Since we now have CASCADE DELETE on FK constraints, 
    -- deleting the tenant will automatically cascade to all related tables
    
    -- Additional cleanup for any remaining orphaned records
    -- Clean up any remaining user sessions or audit logs
    DELETE FROM user_audit_logs WHERE tenant_id = tenant_id_to_delete;
    
    -- Log completion
    RAISE NOTICE 'Cleanup completed for tenant: %', tenant_id_to_delete;
END;
$$;


ALTER FUNCTION public.cleanup_tenant_data(tenant_id_to_delete character varying) OWNER TO neondb_owner;

--
-- Name: execute_data_retention(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.execute_data_retention() RETURNS TABLE(table_name text, records_archived integer, records_deleted integer, execution_status text)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    policy_record RECORD;
    archive_count INTEGER;
    delete_count INTEGER;
    cutoff_date TIMESTAMP;
BEGIN
    -- Loop through active retention policies
    FOR policy_record IN 
        SELECT * FROM data_retention_policies WHERE is_active = true
    LOOP
        -- Calculate cutoff date
        cutoff_date := NOW() - (policy_record.retention_days || ' days')::INTERVAL;
        
        -- Initialize counters
        archive_count := 0;
        delete_count := 0;
        
        -- Handle specific table cleanup logic
        IF policy_record.table_name = 'user_audit_logs' THEN
            -- For audit logs, only delete very old records (beyond 7 years)
            EXECUTE format('DELETE FROM %I WHERE timestamp < $1', policy_record.table_name) 
            USING cutoff_date;
            GET DIAGNOSTICS delete_count = ROW_COUNT;
            
        ELSIF policy_record.table_name = 'database_health_metrics' THEN
            -- Clean up old health metrics
            EXECUTE format('DELETE FROM %I WHERE measurement_time < $1', policy_record.table_name) 
            USING cutoff_date;
            GET DIAGNOSTICS delete_count = ROW_COUNT;
        END IF;
        
        -- Update last executed timestamp
        UPDATE data_retention_policies 
        SET last_executed = NOW() 
        WHERE id = policy_record.id;
        
        -- Return results
        RETURN QUERY SELECT 
            policy_record.table_name::TEXT,
            archive_count,
            delete_count,
            'SUCCESS'::TEXT;
    END LOOP;
END;
$_$;


ALTER FUNCTION public.execute_data_retention() OWNER TO neondb_owner;

--
-- Name: monitor_database_health(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.monitor_database_health() RETURNS TABLE(metric_name text, current_value numeric, status text, recommendation text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Active connections
    RETURN QUERY
    SELECT 
        'active_connections'::TEXT,
        (SELECT count(*)::NUMERIC FROM pg_stat_activity WHERE state = 'active'),
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') > 50 THEN 'CRITICAL'
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') > 30 THEN 'WARNING'
            ELSE 'OK'
        END::TEXT,
        'Monitor connection pooling and consider increasing pool size if consistently high'::TEXT;
    
    -- Database size
    RETURN QUERY
    SELECT 
        'database_size_mb'::TEXT,
        (SELECT pg_database_size(current_database())::NUMERIC / 1024 / 1024),
        CASE 
            WHEN (SELECT pg_database_size(current_database()) / 1024 / 1024) > 1000 THEN 'WARNING'
            ELSE 'OK'
        END::TEXT,
        'Consider archiving old data or implementing data retention policies'::TEXT;
    
    -- Table bloat check (simplified)
    RETURN QUERY
    SELECT 
        'largest_table_size_mb'::TEXT,
        (SELECT pg_total_relation_size(oid)::NUMERIC / 1024 / 1024 
         FROM pg_class 
         WHERE relkind = 'r' 
         ORDER BY pg_total_relation_size(oid) DESC LIMIT 1),
        'OK'::TEXT,
        'Monitor table growth and consider partitioning for very large tables'::TEXT;
END;
$$;


ALTER FUNCTION public.monitor_database_health() OWNER TO neondb_owner;

--
-- Name: production_deployment_checklist(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.production_deployment_checklist() RETURNS TABLE(checklist_item text, status text, details text, priority text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check foreign key constraints
    RETURN QUERY SELECT 
        'Foreign Key Constraints'::TEXT,
        CASE WHEN COUNT(*) >= 22 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || COUNT(*) || ' FK constraints for tenant isolation')::TEXT,
        'CRITICAL'::TEXT
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
        AND constraint_name LIKE 'fk_%_tenant_id';
    
    -- Check RLS policies
    RETURN QUERY SELECT 
        'Row Level Security'::TEXT,
        CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || COUNT(*) || ' RLS policies for tenant isolation')::TEXT,
        'CRITICAL'::TEXT
    FROM pg_policies 
    WHERE policyname LIKE 'tenant_isolation_%';
    
    -- Check indexes
    RETURN QUERY SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 30 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || COUNT(*) || ' performance indexes')::TEXT,
        'HIGH'::TEXT
    FROM pg_indexes 
    WHERE schemaname = 'public' 
        AND (indexname LIKE 'idx_%tenant%' OR indexname LIKE 'idx_%status%' OR indexname LIKE 'idx_%date%');
    
    -- Check backup system
    RETURN QUERY SELECT 
        'Backup System'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_metadata') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Backup tracking system configured'::TEXT,
        'HIGH'::TEXT;
    
    -- Check monitoring system
    RETURN QUERY SELECT 
        'Health Monitoring'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'database_health_metrics') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Database health monitoring system configured'::TEXT,
        'MEDIUM'::TEXT;
    
    -- Check data retention
    RETURN QUERY SELECT 
        'Data Retention Policies'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        ('Found ' || COUNT(*) || ' data retention policies')::TEXT,
        'MEDIUM'::TEXT
    FROM data_retention_policies WHERE is_active = true;
END;
$$;


ALTER FUNCTION public.production_deployment_checklist() OWNER TO neondb_owner;

--
-- Name: schedule_backup(character varying, character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.schedule_backup(backup_type character varying, tenant_filter character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    backup_id INTEGER;
    estimated_size BIGINT;
BEGIN
    -- Calculate estimated backup size
    SELECT pg_database_size(current_database()) INTO estimated_size;
    
    -- Create backup record
    INSERT INTO backup_metadata (
        backup_type, 
        tenant_id, 
        backup_size_bytes, 
        backup_location, 
        backup_status,
        notes
    ) VALUES (
        backup_type,
        tenant_filter,
        estimated_size,
        '/backups/' || backup_type || '_' || EXTRACT(epoch FROM NOW()) || '.sql',
        'scheduled',
        'Automated backup scheduled by production system'
    ) RETURNING id INTO backup_id;
    
    -- Log the backup scheduling
    RAISE NOTICE 'Backup scheduled with ID: %, Type: %, Size: %', 
        backup_id, backup_type, pg_size_pretty(estimated_size);
        
    RETURN backup_id;
END;
$$;


ALTER FUNCTION public.schedule_backup(backup_type character varying, tenant_filter character varying) OWNER TO neondb_owner;

--
-- Name: verify_tenant_data_integrity(character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.verify_tenant_data_integrity(target_tenant_id character varying DEFAULT NULL::character varying) RETURNS TABLE(table_name text, total_records bigint, tenant_records bigint, orphaned_records bigint, integrity_status text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    tenant_filter VARCHAR;
BEGIN
    -- Set tenant filter
    tenant_filter := COALESCE(target_tenant_id, '%');
    
    -- Check customers table
    RETURN QUERY 
    SELECT 
        'customers'::TEXT,
        (SELECT COUNT(*) FROM customers)::BIGINT,
        (SELECT COUNT(*) FROM customers WHERE tenant_id LIKE tenant_filter)::BIGINT,
        (SELECT COUNT(*) FROM customers c LEFT JOIN tenants t ON c.tenant_id = t.id WHERE t.id IS NULL AND c.tenant_id IS NOT NULL)::BIGINT,
        CASE WHEN (SELECT COUNT(*) FROM customers c LEFT JOIN tenants t ON c.tenant_id = t.id WHERE t.id IS NULL AND c.tenant_id IS NOT NULL) = 0 
             THEN 'HEALTHY' ELSE 'ORPHANED_DATA' END::TEXT;
    
    -- Check loan_books table
    RETURN QUERY 
    SELECT 
        'loan_books'::TEXT,
        (SELECT COUNT(*) FROM loan_books)::BIGINT,
        (SELECT COUNT(*) FROM loan_books WHERE tenant_id LIKE tenant_filter)::BIGINT,
        (SELECT COUNT(*) FROM loan_books lb LEFT JOIN tenants t ON lb.tenant_id = t.id WHERE t.id IS NULL AND lb.tenant_id IS NOT NULL)::BIGINT,
        CASE WHEN (SELECT COUNT(*) FROM loan_books lb LEFT JOIN tenants t ON lb.tenant_id = t.id WHERE t.id IS NULL AND lb.tenant_id IS NOT NULL) = 0 
             THEN 'HEALTHY' ELSE 'ORPHANED_DATA' END::TEXT;
             
    -- Check payment_schedules table
    RETURN QUERY 
    SELECT 
        'payment_schedules'::TEXT,
        (SELECT COUNT(*) FROM payment_schedules)::BIGINT,
        (SELECT COUNT(*) FROM payment_schedules WHERE tenant_id LIKE tenant_filter)::BIGINT,
        (SELECT COUNT(*) FROM payment_schedules ps LEFT JOIN tenants t ON ps.tenant_id = t.id WHERE t.id IS NULL AND ps.tenant_id IS NOT NULL)::BIGINT,
        CASE WHEN (SELECT COUNT(*) FROM payment_schedules ps LEFT JOIN tenants t ON ps.tenant_id = t.id WHERE t.id IS NULL AND ps.tenant_id IS NOT NULL) = 0 
             THEN 'HEALTHY' ELSE 'ORPHANED_DATA' END::TEXT;
END;
$$;


ALTER FUNCTION public.verify_tenant_data_integrity(target_tenant_id character varying) OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    asset_name text NOT NULL,
    category text NOT NULL,
    value numeric(15,2) NOT NULL,
    depreciation_rate numeric(5,2),
    purchase_date timestamp without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.assets OWNER TO neondb_owner;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO neondb_owner;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: backup_metadata; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.backup_metadata (
    id integer NOT NULL,
    backup_type character varying(50) NOT NULL,
    tenant_id character varying,
    backup_size_bytes bigint,
    backup_location text NOT NULL,
    backup_status character varying(20) DEFAULT 'in_progress'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    checksum character varying(64),
    notes text
);


ALTER TABLE public.backup_metadata OWNER TO neondb_owner;

--
-- Name: backup_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.backup_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backup_metadata_id_seq OWNER TO neondb_owner;

--
-- Name: backup_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.backup_metadata_id_seq OWNED BY public.backup_metadata.id;


--
-- Name: bank_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bank_management (
    id integer NOT NULL,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_type text NOT NULL,
    balance numeric(15,2) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.bank_management OWNER TO neondb_owner;

--
-- Name: bank_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bank_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_management_id_seq OWNER TO neondb_owner;

--
-- Name: bank_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bank_management_id_seq OWNED BY public.bank_management.id;


--
-- Name: connection_pool_status; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.connection_pool_status AS
 SELECT 'total_connections'::text AS metric,
    (count(*))::text AS current_value,
        CASE
            WHEN (count(*) > 100) THEN 'Verify connection pooling configuration'::text
            ELSE 'Connection count normal'::text
        END AS recommendation
   FROM pg_stat_activity
  WHERE (pg_stat_activity.state IS NOT NULL)
UNION ALL
 SELECT 'idle_connections'::text AS metric,
    (count(*))::text AS current_value,
        CASE
            WHEN (count(*) > 50) THEN 'Consider reducing idle connection timeout'::text
            ELSE 'Idle connection count normal'::text
        END AS recommendation
   FROM pg_stat_activity
  WHERE (pg_stat_activity.state = 'idle'::text)
UNION ALL
 SELECT 'active_connections'::text AS metric,
    (count(*))::text AS current_value,
        CASE
            WHEN (count(*) > 25) THEN 'High active connection count - monitor performance'::text
            ELSE 'Active connection count normal'::text
        END AS recommendation
   FROM pg_stat_activity
  WHERE (pg_stat_activity.state = 'active'::text);


ALTER VIEW public.connection_pool_status OWNER TO neondb_owner;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    national_id text,
    credit_score integer,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password text,
    is_portal_active boolean DEFAULT false,
    last_portal_login timestamp without time zone,
    tenant_id character varying
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: data_retention_policies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.data_retention_policies (
    id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    retention_days integer NOT NULL,
    retention_condition text,
    archive_before_delete boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    last_executed timestamp without time zone,
    notes text
);


ALTER TABLE public.data_retention_policies OWNER TO neondb_owner;

--
-- Name: data_retention_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.data_retention_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.data_retention_policies_id_seq OWNER TO neondb_owner;

--
-- Name: data_retention_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.data_retention_policies_id_seq OWNED BY public.data_retention_policies.id;


--
-- Name: database_health_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.database_health_metrics (
    id integer NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value numeric,
    tenant_id character varying,
    measurement_time timestamp without time zone DEFAULT now(),
    threshold_min numeric,
    threshold_max numeric,
    alert_level character varying(20) DEFAULT 'info'::character varying,
    notes text
);


ALTER TABLE public.database_health_metrics OWNER TO neondb_owner;

--
-- Name: database_health_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.database_health_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.database_health_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: database_health_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.database_health_metrics_id_seq OWNED BY public.database_health_metrics.id;


--
-- Name: database_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.database_migrations (
    id integer NOT NULL,
    migration_name character varying(255) NOT NULL,
    migration_version character varying(50),
    executed_at timestamp without time zone DEFAULT now(),
    execution_time_ms integer,
    rollback_sql text,
    notes text,
    executed_by character varying(100) DEFAULT CURRENT_USER
);


ALTER TABLE public.database_migrations OWNER TO neondb_owner;

--
-- Name: database_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.database_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.database_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: database_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.database_migrations_id_seq OWNED BY public.database_migrations.id;


--
-- Name: equity; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.equity (
    id integer NOT NULL,
    equity_type text NOT NULL,
    amount numeric(15,2) NOT NULL,
    date timestamp without time zone NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.equity OWNER TO neondb_owner;

--
-- Name: equity_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.equity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equity_id_seq OWNER TO neondb_owner;

--
-- Name: equity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.equity_id_seq OWNED BY public.equity.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    category text NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    payment_method text,
    created_at timestamp without time zone DEFAULT now(),
    vendor text,
    tenant_id character varying
);


ALTER TABLE public.expenses OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: income_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.income_management (
    id integer NOT NULL,
    source text NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    category text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.income_management OWNER TO neondb_owner;

--
-- Name: income_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.income_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.income_management_id_seq OWNER TO neondb_owner;

--
-- Name: income_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.income_management_id_seq OWNED BY public.income_management.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    total_value numeric(15,2) NOT NULL,
    supplier text,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying,
    status text DEFAULT 'in_stock'::text NOT NULL,
    description text
);


ALTER TABLE public.inventory OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: liabilities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.liabilities (
    id integer NOT NULL,
    liability_name text NOT NULL,
    amount numeric(15,2) NOT NULL,
    due_date timestamp without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    creditor text,
    interest_rate numeric(5,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.liabilities OWNER TO neondb_owner;

--
-- Name: liabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.liabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.liabilities_id_seq OWNER TO neondb_owner;

--
-- Name: liabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.liabilities_id_seq OWNED BY public.liabilities.id;


--
-- Name: loan_books; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loan_books (
    id integer NOT NULL,
    customer_id integer,
    loan_amount numeric(15,2) NOT NULL,
    interest_rate numeric(5,2) NOT NULL,
    term integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by integer,
    disbursed_amount numeric(15,2),
    outstanding_balance numeric(15,2),
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    purpose text,
    date_applied timestamp without time zone,
    loan_product_id integer,
    assigned_officer integer,
    approval_date timestamp without time zone,
    rejection_reason text,
    disbursed_by integer,
    disbursement_date timestamp without time zone,
    notes text,
    tenant_id character varying
);


ALTER TABLE public.loan_books OWNER TO neondb_owner;

--
-- Name: loan_books_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.loan_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loan_books_id_seq OWNER TO neondb_owner;

--
-- Name: loan_books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.loan_books_id_seq OWNED BY public.loan_books.id;


--
-- Name: loan_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loan_products (
    id integer NOT NULL,
    name text NOT NULL,
    fee numeric(15,2) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.loan_products OWNER TO neondb_owner;

--
-- Name: loan_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.loan_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loan_products_id_seq OWNER TO neondb_owner;

--
-- Name: loan_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.loan_products_id_seq OWNED BY public.loan_products.id;


--
-- Name: mfi_registration; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mfi_registration (
    id integer NOT NULL,
    company_name character varying NOT NULL,
    registration_number character varying NOT NULL,
    license_expiry_date date,
    registered_address text NOT NULL,
    contact_phone character varying,
    contact_email character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    certificate_of_incorporation text,
    tax_clearance_certificate text,
    physical_address text,
    paid_up_capital numeric(15,2),
    minimum_capital_required numeric(15,2) DEFAULT 2000000.00,
    bog_license_number text,
    is_active boolean DEFAULT true,
    tenant_id character varying
);


ALTER TABLE public.mfi_registration OWNER TO neondb_owner;

--
-- Name: mfi_registration_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mfi_registration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mfi_registration_id_seq OWNER TO neondb_owner;

--
-- Name: mfi_registration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mfi_registration_id_seq OWNED BY public.mfi_registration.id;


--
-- Name: payment_schedules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_schedules (
    id integer NOT NULL,
    loan_id integer,
    due_date timestamp without time zone NOT NULL,
    amount numeric(15,2) NOT NULL,
    principal_amount numeric(15,2) NOT NULL,
    interest_amount numeric(15,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_date timestamp without time zone,
    paid_amount numeric(15,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id character varying
);


ALTER TABLE public.payment_schedules OWNER TO neondb_owner;

--
-- Name: payment_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_schedules_id_seq OWNER TO neondb_owner;

--
-- Name: payment_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_schedules_id_seq OWNED BY public.payment_schedules.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    resource text NOT NULL,
    action text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO neondb_owner;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: petty_cash; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.petty_cash (
    id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    purpose text NOT NULL,
    date timestamp without time zone NOT NULL,
    handled_by integer,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.petty_cash OWNER TO neondb_owner;

--
-- Name: petty_cash_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.petty_cash_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.petty_cash_id_seq OWNER TO neondb_owner;

--
-- Name: petty_cash_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.petty_cash_id_seq OWNED BY public.petty_cash.id;


--
-- Name: production_alerts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.production_alerts (
    id integer NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    alert_message text NOT NULL,
    tenant_id character varying,
    table_affected character varying(100),
    metric_value numeric,
    threshold_breached numeric,
    is_resolved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    resolved_by character varying(100),
    resolution_notes text
);


ALTER TABLE public.production_alerts OWNER TO neondb_owner;

--
-- Name: production_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.production_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_alerts_id_seq OWNER TO neondb_owner;

--
-- Name: production_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.production_alerts_id_seq OWNED BY public.production_alerts.id;


--
-- Name: rent_management; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rent_management (
    id integer NOT NULL,
    property_name text NOT NULL,
    tenant_name text NOT NULL,
    monthly_rent numeric(15,2) NOT NULL,
    due_date timestamp without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.rent_management OWNER TO neondb_owner;

--
-- Name: rent_management_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.rent_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rent_management_id_seq OWNER TO neondb_owner;

--
-- Name: rent_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.rent_management_id_seq OWNED BY public.rent_management.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    report_type text NOT NULL,
    title text NOT NULL,
    content text,
    generated_by integer,
    created_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.reports OWNER TO neondb_owner;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO neondb_owner;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    hierarchy_level integer NOT NULL,
    is_system_role boolean DEFAULT true,
    tenant_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: shareholders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shareholders (
    id integer NOT NULL,
    shareholder_type character varying DEFAULT 'local'::character varying NOT NULL,
    name character varying NOT NULL,
    nationality character varying NOT NULL,
    id_type character varying DEFAULT 'ghana_card'::character varying NOT NULL,
    id_number character varying NOT NULL,
    address text NOT NULL,
    contact_phone character varying,
    contact_email character varying,
    shares_owned integer NOT NULL,
    share_percentage numeric(5,2) NOT NULL,
    investment_amount numeric(15,2) NOT NULL,
    investment_currency character varying DEFAULT 'GHS'::character varying,
    gipc_certificate text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.shareholders OWNER TO neondb_owner;

--
-- Name: shareholders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shareholders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shareholders_id_seq OWNER TO neondb_owner;

--
-- Name: shareholders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shareholders_id_seq OWNED BY public.shareholders.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    "position" text NOT NULL,
    salary numeric(15,2),
    hire_date timestamp without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_messages (
    id integer NOT NULL,
    tenant_id character varying NOT NULL,
    ticket_id integer NOT NULL,
    sender_type character varying NOT NULL,
    sender_id integer,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.support_messages OWNER TO neondb_owner;

--
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.support_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_messages_id_seq OWNER TO neondb_owner;

--
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.support_messages_id_seq OWNED BY public.support_messages.id;


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    tenant_id character varying NOT NULL,
    customer_id integer,
    title character varying NOT NULL,
    description text,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    category character varying,
    assigned_to integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    customer_email character varying,
    customer_phone character varying,
    resolution text,
    resolved_at timestamp without time zone
);


ALTER TABLE public.support_tickets OWNER TO neondb_owner;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_id_seq OWNER TO neondb_owner;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- Name: user_audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_audit_logs (
    id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    description text,
    ip_address text,
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT now(),
    tenant_id character varying
);


ALTER TABLE public.user_audit_logs OWNER TO neondb_owner;

--
-- Name: user_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: user_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_audit_logs_id_seq OWNED BY public.user_audit_logs.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    tenant_id character varying NOT NULL,
    assigned_by integer,
    assigned_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_roles OWNER TO neondb_owner;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO neondb_owner;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: user_tenant_access; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_tenant_access (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tenant_id character varying NOT NULL,
    role character varying DEFAULT 'user'::character varying,
    permissions text[],
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_tenant_access OWNER TO neondb_owner;

--
-- Name: user_tenant_access_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_tenant_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_tenant_access_id_seq OWNER TO neondb_owner;

--
-- Name: user_tenant_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_tenant_access_id_seq OWNED BY public.user_tenant_access.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    profile_picture text,
    first_name text,
    last_name text,
    phone text,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    tenant_id character varying,
    is_super_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: backup_metadata id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.backup_metadata ALTER COLUMN id SET DEFAULT nextval('public.backup_metadata_id_seq'::regclass);


--
-- Name: bank_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bank_management ALTER COLUMN id SET DEFAULT nextval('public.bank_management_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: data_retention_policies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_retention_policies ALTER COLUMN id SET DEFAULT nextval('public.data_retention_policies_id_seq'::regclass);


--
-- Name: database_health_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_health_metrics ALTER COLUMN id SET DEFAULT nextval('public.database_health_metrics_id_seq'::regclass);


--
-- Name: database_migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_migrations ALTER COLUMN id SET DEFAULT nextval('public.database_migrations_id_seq'::regclass);


--
-- Name: equity id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equity ALTER COLUMN id SET DEFAULT nextval('public.equity_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: income_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.income_management ALTER COLUMN id SET DEFAULT nextval('public.income_management_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: liabilities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.liabilities ALTER COLUMN id SET DEFAULT nextval('public.liabilities_id_seq'::regclass);


--
-- Name: loan_books id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books ALTER COLUMN id SET DEFAULT nextval('public.loan_books_id_seq'::regclass);


--
-- Name: loan_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_products ALTER COLUMN id SET DEFAULT nextval('public.loan_products_id_seq'::regclass);


--
-- Name: mfi_registration id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfi_registration ALTER COLUMN id SET DEFAULT nextval('public.mfi_registration_id_seq'::regclass);


--
-- Name: payment_schedules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_schedules ALTER COLUMN id SET DEFAULT nextval('public.payment_schedules_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: petty_cash id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.petty_cash ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_id_seq'::regclass);


--
-- Name: production_alerts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_alerts ALTER COLUMN id SET DEFAULT nextval('public.production_alerts_id_seq'::regclass);


--
-- Name: rent_management id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rent_management ALTER COLUMN id SET DEFAULT nextval('public.rent_management_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: shareholders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shareholders ALTER COLUMN id SET DEFAULT nextval('public.shareholders_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages ALTER COLUMN id SET DEFAULT nextval('public.support_messages_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: user_audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.user_audit_logs_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: user_tenant_access id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_tenant_access ALTER COLUMN id SET DEFAULT nextval('public.user_tenant_access_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.assets (id, asset_name, category, value, depreciation_rate, purchase_date, status, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: backup_metadata; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.backup_metadata (id, backup_type, tenant_id, backup_size_bytes, backup_location, backup_status, created_at, completed_at, checksum, notes) FROM stdin;
\.


--
-- Data for Name: bank_management; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bank_management (id, bank_name, account_number, account_type, balance, status, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, first_name, last_name, email, phone, address, national_id, credit_score, status, created_at, updated_at, password, is_portal_active, last_portal_login, tenant_id) FROM stdin;
19	Kwame	Bonsu	kwamebonsu@grandcleaningservices.com	0203901772	42 Konka Street, Dansoman	GHA-0009996763-5	800	active	2025-08-26 19:27:36.615465	2025-08-26 19:27:36.615465	$2b$10$8iEntplLU7KhupU3bQrcF.HfCgdM2OfS7zHqkN8KhmRkgwH0Vxbby	t	\N	default-tenant-001
22	James 	Tecko	james@email.com	0302992344		GHA-0008466763-2	870	active	2025-08-28 21:36:32.645821	2025-09-02 09:18:36.807	$2b$10$RiY8WWq8zglXZw.SZ7zDfOFpBlGOaNYfnUD3PesAgVWoi4s7DgEq.	t	2025-09-02 09:18:36.807	default-tenant-001
23	Kwame	Asante	kwame@abc-micro.com	+233241111111	Accra, Ghana	GHA123456789	750	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	t	\N	test-tenant-001
20	John	Kuma	john@email.com	0203901772	Kwabenya	GHA-0009996763-5	800	active	2025-08-28 12:20:33.679308	2025-08-28 12:31:53.719	$2b$10$S20XMfOul486.e97tWZo6.NeMa6S6PsqytyJp4U9yZUqkc3BLqq3e	t	2025-08-28 12:31:53.719	default-tenant-001
24	Akosua	Mensah	akosua@abc-micro.com	+233241111112	Kumasi, Ghana	GHA123456790	680	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	t	\N	test-tenant-001
25	Kofi	Adjei	kofi@abc-micro.com	+233241111113	Tema, Ghana	GHA123456791	720	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	f	\N	test-tenant-001
26	John	Smith	john.smith@xyz-credit.com	+14155551234	New York, USA	USA987654321	800	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	t	\N	test-tenant-002
27	Jane	Doe	jane.doe@xyz-credit.com	+14155551235	California, USA	USA987654322	760	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	t	\N	test-tenant-002
28	Hans	Mueller	hans@global-finance.com	+491234567890	Berlin, Germany	DEU456789123	700	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	t	\N	test-tenant-003
29	Marie	Dubois	marie@global-finance.com	+331234567891	Paris, France	FRA789123456	780	active	2025-09-11 13:13:43.655876	2025-09-11 13:13:43.655876	$2b$10$123hash	f	\N	test-tenant-003
21	Kwaku 	Gyasi	kwaku@gmail.com	0209934849		GHA-0008466763-2	790	active	2025-08-28 19:49:30.568746	2025-08-28 20:37:04.202	$2b$10$YpBm3Y5Q9LfzQJcSVxFkf.1vQWCpZvuFHC7rqBqWDjNwv8kKF3FU2	t	2025-08-28 20:37:04.202	default-tenant-001
\.


--
-- Data for Name: data_retention_policies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.data_retention_policies (id, table_name, retention_days, retention_condition, archive_before_delete, is_active, created_at, last_executed, notes) FROM stdin;
1	user_audit_logs	2555	\N	t	t	2025-08-21 02:56:25.077641	\N	Keep audit logs for 7 years for compliance
2	payment_schedules	2555	status = 'paid'	t	t	2025-08-21 02:56:25.077641	\N	Keep paid schedules for 7 years
3	backup_metadata	90	backup_status = 'completed'	t	t	2025-08-21 02:56:25.077641	\N	Keep backup metadata for 3 months
4	database_health_metrics	30	\N	t	t	2025-08-21 02:56:25.077641	\N	Keep health metrics for 1 month
\.


--
-- Data for Name: database_health_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.database_health_metrics (id, metric_name, metric_value, tenant_id, measurement_time, threshold_min, threshold_max, alert_level, notes) FROM stdin;
\.


--
-- Data for Name: database_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.database_migrations (id, migration_name, migration_version, executed_at, execution_time_ms, rollback_sql, notes, executed_by) FROM stdin;
1	baseline_schema_with_tenant_isolation	1.0.0	2025-08-21 02:56:36.32124	\N	\N	Initial production-ready schema with RLS and FK constraints	neondb_owner
2	add_foreign_key_constraints	1.1.0	2025-08-21 02:56:36.32124	\N	\N	Added 22 FK constraints for tenant isolation	neondb_owner
3	enable_row_level_security	1.2.0	2025-08-21 02:56:36.32124	\N	\N	Enabled RLS on all multi-tenant tables	neondb_owner
4	add_performance_indexes	1.3.0	2025-08-21 02:56:36.32124	\N	\N	Added 30+ indexes for optimal performance	neondb_owner
5	add_production_readiness_features	1.4.0	2025-08-21 02:56:36.32124	\N	\N	Added backup tracking, health monitoring, and data retention	neondb_owner
\.


--
-- Data for Name: equity; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.equity (id, equity_type, amount, date, description, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expenses (id, category, amount, description, date, payment_method, created_at, vendor, tenant_id) FROM stdin;
3	Personnel	13500.00	Staff salaries for August 2024	2024-08-01 00:00:00	\N	2025-08-14 23:59:37.102418	Payroll Department	default-tenant-001
4	Overhead	3200.00	Office rent for August 2024	2024-08-01 00:00:00	\N	2025-08-14 23:59:37.102418	Unity Properties Ltd	default-tenant-001
\.


--
-- Data for Name: income_management; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.income_management (id, source, amount, description, date, category, created_at, tenant_id) FROM stdin;
16	Processing Fees	2150.00	Loan processing fees collected	2024-08-01 00:00:00	Fee Income	2025-08-14 23:59:37.074797	default-tenant-001
17	Interest Payment	3332.56	Interest payment from loan payment schedule #184	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:04:30.361356	default-tenant-001
18	Interest Payment	1240.06	Interest payment from loan payment schedule #210	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:09:36.225733	default-tenant-001
19	Interest Payment	4166.67	Interest payment from loan payment schedule #179	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.73473	default-tenant-001
20	Interest Payment	4001.23	Interest payment from loan payment schedule #180	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.782553	default-tenant-001
21	Interest Payment	3835.10	Interest payment from loan payment schedule #181	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.829504	default-tenant-001
22	Interest Payment	2916.67	Interest payment from loan payment schedule #203	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.873846	default-tenant-001
23	Interest Payment	2681.31	Interest payment from loan payment schedule #204	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.918055	default-tenant-001
24	Interest Payment	2444.58	Interest payment from loan payment schedule #205	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:53.96138	default-tenant-001
25	Interest Payment	2206.47	Interest payment from loan payment schedule #206	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.004674	default-tenant-001
26	Interest Payment	1966.97	Interest payment from loan payment schedule #207	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.051191	default-tenant-001
27	Interest Payment	1726.08	Interest payment from loan payment schedule #208	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.094774	default-tenant-001
28	Interest Payment	1483.78	Interest payment from loan payment schedule #209	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.13882	default-tenant-001
29	Interest Payment	3668.29	Interest payment from loan payment schedule #182	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.183489	default-tenant-001
30	Interest Payment	3420.70	Interest payment from loan payment schedule #183	2025-08-18 00:00:00	Loan Interest	2025-08-18 11:10:54.228098	default-tenant-001
15	Interest Payment	5240.50	Monthly interest payments from active loa	2024-08-01 00:00:00	Loan Interest	2025-08-14 23:59:37.074797	default-tenant-001
31	Interest Payment	4166.67	Interest payment from loan payment schedule #215	2025-08-26 00:00:00	Loan Interest	2025-08-26 19:46:41.212827	default-tenant-001
32	Interest Payment	16.67	Interest payment from loan payment schedule #227	2025-08-28 00:00:00	Loan Interest	2025-08-28 12:31:18.731837	default-tenant-001
33	Interest Payment	50.00	Interest payment from loan payment schedule #251	2025-08-28 00:00:00	Loan Interest	2025-08-28 20:36:27.115393	default-tenant-001
34	Interest Payment	133.33	Interest payment from loan payment schedule #266	2025-09-02 00:00:00	Loan Interest	2025-09-02 10:47:07.794245	default-tenant-001
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory (id, item_name, category, quantity, unit_price, total_value, supplier, last_updated, created_at, tenant_id, status, description) FROM stdin;
\.


--
-- Data for Name: liabilities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.liabilities (id, liability_name, amount, due_date, status, creditor, interest_rate, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: loan_books; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loan_books (id, customer_id, loan_amount, interest_rate, term, status, approved_by, disbursed_amount, outstanding_balance, start_date, end_date, created_at, updated_at, purpose, date_applied, loan_product_id, assigned_officer, approval_date, rejection_reason, disbursed_by, disbursement_date, notes, tenant_id) FROM stdin;
20	20	20000.00	1.00	24	disbursed	1	20000.00	\N	\N	\N	2025-08-28 12:30:14.100993	2025-08-28 12:30:40.229	emergency money	2025-08-28 00:00:00	8	3	2025-08-28 12:30:26.292	\N	1	2025-08-28 12:30:40.017		default-tenant-001
21	21	5000.00	12.00	15	disbursed	1	5000.00	\N	\N	\N	2025-08-28 20:34:07.12213	2025-08-28 20:36:15.83	education	2025-08-28 20:34:07.102	\N	3	2025-08-28 20:35:57.384	\N	1	2025-08-28 20:36:15.627	disbursed	default-tenant-001
22	22	40000.00	4.00	9	disbursed	1	40000.00	\N	\N	\N	2025-08-28 21:37:24.127921	2025-08-28 21:37:53.934	purpose	2025-08-28 00:00:00	8	3	2025-08-28 21:37:37.569	\N	1	2025-08-28 21:37:53.767	disbursed	default-tenant-001
23	23	5000.00	12.50	12	approved	8	5000.00	4200.00	2024-01-15 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Business expansion	2024-01-10 00:00:00	\N	9	2024-01-12 00:00:00	\N	\N	\N	\N	\N
24	24	3000.00	15.00	6	active	8	3000.00	2500.00	2024-02-01 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Agriculture	2024-01-25 00:00:00	\N	9	2024-01-28 00:00:00	\N	\N	\N	\N	\N
25	25	7500.00	10.00	18	pending	\N	\N	7500.00	\N	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Equipment purchase	2024-03-01 00:00:00	\N	9	\N	\N	\N	\N	\N	\N
26	26	15000.00	8.50	24	approved	11	15000.00	12000.00	2024-01-20 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Home improvement	2024-01-15 00:00:00	\N	12	2024-01-18 00:00:00	\N	\N	\N	\N	\N
27	27	8000.00	9.00	12	active	11	8000.00	6500.00	2024-02-10 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Vehicle purchase	2024-02-05 00:00:00	\N	12	2024-02-08 00:00:00	\N	\N	\N	\N	\N
28	28	25000.00	6.50	36	approved	13	25000.00	20000.00	2024-01-25 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Business loan	2024-01-20 00:00:00	\N	13	2024-01-23 00:00:00	\N	\N	\N	\N	\N
29	29	12000.00	7.00	24	active	13	12000.00	10000.00	2024-02-15 00:00:00	\N	2025-09-11 13:14:10.992249	2025-09-11 13:14:10.992249	Education loan	2024-02-10 00:00:00	\N	13	2024-02-12 00:00:00	\N	\N	\N	\N	\N
19	19	1000000.00	5.00	12	disbursed	\N	1000000.00	\N	\N	\N	2025-08-26 19:28:11.700503	2025-08-26 19:28:35.305	business in the eastern region	2025-08-26 00:00:00	6	3	\N	\N	1	2025-08-26 19:28:35.124	same dough disbursed	default-tenant-001
\.


--
-- Data for Name: loan_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loan_products (id, name, fee, description, is_active, created_at, updated_at, tenant_id) FROM stdin;
6	Business Loan	15.00	Quick loans for business expansion	t	2025-08-14 23:58:30.882557	2025-08-18 12:15:17.516	default-tenant-001
8	Emergency Loan	10.00	Fast loans for urgent needs	t	2025-08-14 23:58:30.882557	2025-08-18 12:15:36.571	default-tenant-001
7	Agricultural Loan	5.00	Seasonal loans for farmers and agribusiness	t	2025-08-14 23:58:30.882557	2025-08-18 12:15:49.694	default-tenant-001
\.


--
-- Data for Name: mfi_registration; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mfi_registration (id, company_name, registration_number, license_expiry_date, registered_address, contact_phone, contact_email, created_at, updated_at, certificate_of_incorporation, tax_clearance_certificate, physical_address, paid_up_capital, minimum_capital_required, bog_license_number, is_active, tenant_id) FROM stdin;
\.


--
-- Data for Name: payment_schedules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_schedules (id, loan_id, due_date, amount, principal_amount, interest_amount, status, paid_date, paid_amount, created_at, updated_at, tenant_id) FROM stdin;
228	20	2025-10-01 12:30:14.146	842.04	826.06	15.98	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
229	20	2025-11-01 12:30:14.146	842.04	826.75	15.29	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
230	20	2025-12-01 12:30:14.146	842.04	827.44	14.60	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
231	20	2026-01-01 12:30:14.146	842.04	828.13	13.91	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
232	20	2026-02-01 12:30:14.146	842.04	828.82	13.22	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
233	20	2026-03-01 12:30:14.146	842.04	829.51	12.53	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
234	20	2026-04-01 12:30:14.146	842.04	830.20	11.84	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
235	20	2026-05-01 12:30:14.146	842.04	830.89	11.15	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
236	20	2026-06-01 12:30:14.146	842.04	831.59	10.46	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
237	20	2026-07-01 12:30:14.146	842.04	832.28	9.76	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
238	20	2026-08-01 12:30:14.146	842.04	832.97	9.07	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
239	20	2026-09-01 12:30:14.146	842.04	833.67	8.37	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
240	20	2026-10-01 12:30:14.146	842.04	834.36	7.68	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
241	20	2026-11-01 12:30:14.146	842.04	835.06	6.98	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
242	20	2026-12-01 12:30:14.146	842.04	835.75	6.29	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
243	20	2027-01-01 12:30:14.146	842.04	836.45	5.59	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
244	20	2027-02-01 12:30:14.146	842.04	837.15	4.90	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
245	20	2027-03-01 12:30:14.146	842.04	837.84	4.20	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
246	20	2027-04-01 12:30:14.146	842.04	838.54	3.50	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
247	20	2027-05-01 12:30:14.146	842.04	839.24	2.80	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
248	20	2027-06-01 12:30:14.146	842.04	839.94	2.10	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
249	20	2027-07-01 12:30:14.146	842.04	840.64	1.40	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
250	20	2027-08-01 12:30:14.146	842.04	841.34	0.70	pending	\N	\N	2025-08-28 12:30:14.163209	2025-08-28 12:30:14.163209	default-tenant-001
227	20	2025-09-01 12:30:14.146	842.04	825.37	16.67	paid	2025-08-28 12:31:18.456	842.04	2025-08-28 12:30:14.163209	2025-08-28 12:31:18.692	default-tenant-001
252	21	2025-10-01 20:34:07.181	360.62	313.73	46.89	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
253	21	2025-11-01 20:34:07.181	360.62	316.86	43.76	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
254	21	2025-12-01 20:34:07.181	360.62	320.03	40.59	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
255	21	2026-01-01 20:34:07.181	360.62	323.23	37.39	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
256	21	2026-02-01 20:34:07.181	360.62	326.46	34.16	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
257	21	2026-03-01 20:34:07.181	360.62	329.73	30.89	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
258	21	2026-04-01 20:34:07.181	360.62	333.03	27.59	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
259	21	2026-05-01 20:34:07.181	360.62	336.36	24.26	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
260	21	2026-06-01 20:34:07.181	360.62	339.72	20.90	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
261	21	2026-07-01 20:34:07.181	360.62	343.12	17.50	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
262	21	2026-08-01 20:34:07.181	360.62	346.55	14.07	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
263	21	2026-09-01 20:34:07.181	360.62	350.01	10.61	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
264	21	2026-10-01 20:34:07.181	360.62	353.51	7.11	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
265	21	2026-11-01 20:34:07.181	360.62	357.05	3.57	pending	\N	\N	2025-08-28 20:34:07.197395	2025-08-28 20:34:07.197395	default-tenant-001
251	21	2025-09-01 20:34:07.181	360.62	310.62	50.00	paid	2025-08-28 20:36:26.851	360.62	2025-08-28 20:34:07.197395	2025-08-28 20:36:27.075	default-tenant-001
267	22	2025-10-01 21:37:24.152	4518.85	4400.13	118.71	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
268	22	2025-11-01 21:37:24.152	4518.85	4414.80	104.05	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
269	22	2025-12-01 21:37:24.152	4518.85	4429.52	89.33	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
270	22	2026-01-01 21:37:24.152	4518.85	4444.28	74.57	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
271	22	2026-02-01 21:37:24.152	4518.85	4459.09	59.75	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
272	22	2026-03-01 21:37:24.152	4518.85	4473.96	44.89	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
273	22	2026-04-01 21:37:24.152	4518.85	4488.87	29.98	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
274	22	2026-05-01 21:37:24.152	4518.85	4503.83	15.01	pending	\N	\N	2025-08-28 21:37:24.166888	2025-08-28 21:37:24.166888	default-tenant-001
266	22	2025-09-01 21:37:24.152	4518.85	4385.51	133.33	paid	2025-09-02 10:47:07.505	4518.85	2025-08-28 21:37:24.166888	2025-09-02 10:47:07.743	default-tenant-001
216	19	2025-10-01 19:28:11.729	85607.48	81780.15	3827.33	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
217	19	2025-11-01 19:28:11.729	85607.48	82120.90	3486.58	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
218	19	2025-12-01 19:28:11.729	85607.48	82463.07	3144.41	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
219	19	2026-01-01 19:28:11.729	85607.48	82806.67	2800.81	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
220	19	2026-02-01 19:28:11.729	85607.48	83151.70	2455.78	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
221	19	2026-03-01 19:28:11.729	85607.48	83498.16	2109.32	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
222	19	2026-04-01 19:28:11.729	85607.48	83846.07	1761.41	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
223	19	2026-05-01 19:28:11.729	85607.48	84195.43	1412.05	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
224	19	2026-06-01 19:28:11.729	85607.48	84546.24	1061.24	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
225	19	2026-07-01 19:28:11.729	85607.48	84898.52	708.96	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
215	19	2025-09-01 19:28:11.729	85607.48	81440.82	4166.67	paid	2025-08-26 19:46:40.954	85607.48	2025-08-26 19:28:11.744871	2025-08-26 19:46:41.144	default-tenant-001
226	19	2026-08-01 19:28:11.729	85607.48	85252.26	355.22	pending	\N	\N	2025-08-26 19:28:11.744871	2025-08-26 19:28:11.744871	default-tenant-001
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, category, description, resource, action, created_at) FROM stdin;
1	customers:view	data_access	View customer information	customers	view	2025-08-14 21:39:41.337874
2	customers:create	data_access	Create new customers	customers	create	2025-08-14 21:39:41.337874
3	customers:edit	data_access	Edit customer information	customers	edit	2025-08-14 21:39:41.337874
4	customers:delete	data_access	Delete customers	customers	delete	2025-08-14 21:39:41.337874
5	customers:view_own	data_access	View only assigned customers	customers	view_own	2025-08-14 21:39:41.337874
6	loans:view	data_access	View loan information	loans	view	2025-08-14 21:39:41.337874
7	loans:create	data_access	Create new loans	loans	create	2025-08-14 21:39:41.337874
8	loans:edit	data_access	Edit loan information	loans	edit	2025-08-14 21:39:41.337874
9	loans:delete	data_access	Delete loans	loans	delete	2025-08-14 21:39:41.337874
10	loans:view_own	data_access	View only assigned loans	loans	view_own	2025-08-14 21:39:41.337874
11	staff:view	data_access	View staff information	staff	view	2025-08-14 21:39:41.337874
12	staff:create	data_access	Create new staff	staff	create	2025-08-14 21:39:41.337874
13	staff:edit	data_access	Edit staff information	staff	edit	2025-08-14 21:39:41.337874
14	staff:delete	data_access	Delete staff	staff	delete	2025-08-14 21:39:41.337874
15	loans:approve	financial_operations	Approve loan applications	loans	approve	2025-08-14 21:39:41.337874
16	loans:disburse	financial_operations	Disburse approved loans	loans	disburse	2025-08-14 21:39:41.337874
17	loans:reject	financial_operations	Reject loan applications	loans	reject	2025-08-14 21:39:41.337874
18	payments:create	financial_operations	Record payments	payments	create	2025-08-14 21:39:41.337874
19	payments:edit	financial_operations	Edit payment records	payments	edit	2025-08-14 21:39:41.337874
20	payments:delete	financial_operations	Delete payment records	payments	delete	2025-08-14 21:39:41.337874
21	payments:view	financial_operations	View payment records	payments	view	2025-08-14 21:39:41.337874
22	income:view	financial_operations	View income records	income	view	2025-08-14 21:39:41.337874
23	income:create	financial_operations	Create income records	income	create	2025-08-14 21:39:41.337874
24	income:edit	financial_operations	Edit income records	income	edit	2025-08-14 21:39:41.337874
25	income:delete	financial_operations	Delete income records	income	delete	2025-08-14 21:39:41.337874
26	expenses:view	financial_operations	View expense records	expenses	view	2025-08-14 21:39:41.337874
27	expenses:create	financial_operations	Create expense records	expenses	create	2025-08-14 21:39:41.337874
28	expenses:edit	financial_operations	Edit expense records	expenses	edit	2025-08-14 21:39:41.337874
29	expenses:delete	financial_operations	Delete expense records	expenses	delete	2025-08-14 21:39:41.337874
30	bank_accounts:view	financial_operations	View bank accounts	bank_accounts	view	2025-08-14 21:39:41.337874
31	bank_accounts:create	financial_operations	Create bank accounts	bank_accounts	create	2025-08-14 21:39:41.337874
32	bank_accounts:edit	financial_operations	Edit bank accounts	bank_accounts	edit	2025-08-14 21:39:41.337874
33	bank_accounts:delete	financial_operations	Delete bank accounts	bank_accounts	delete	2025-08-14 21:39:41.337874
34	users:view	user_management	View users	users	view	2025-08-14 21:39:52.353692
35	users:create	user_management	Create new users	users	create	2025-08-14 21:39:52.353692
36	users:edit	user_management	Edit user information	users	edit	2025-08-14 21:39:52.353692
37	users:delete	user_management	Delete users	users	delete	2025-08-14 21:39:52.353692
38	users:assign_roles	user_management	Assign roles to users	users	assign_roles	2025-08-14 21:39:52.353692
39	tenant:manage_settings	administrative	Manage tenant settings	tenant	manage_settings	2025-08-14 21:39:52.353692
40	tenant:manage_branding	administrative	Manage tenant branding	tenant	manage_branding	2025-08-14 21:39:52.353692
41	tenant:view_analytics	administrative	View tenant analytics	tenant	view_analytics	2025-08-14 21:39:52.353692
42	system:manage_tenants	administrative	Manage all tenants (super admin)	system	manage_tenants	2025-08-14 21:39:52.353692
43	system:view_system_analytics	administrative	View system-wide analytics	system	view_system_analytics	2025-08-14 21:39:52.353692
44	reports:basic	reporting	View basic reports	reports	basic	2025-08-14 21:39:52.353692
45	reports:financial	reporting	View financial reports	reports	financial	2025-08-14 21:39:52.353692
46	reports:executive	reporting	View executive reports	reports	executive	2025-08-14 21:39:52.353692
47	reports:export	reporting	Export reports	reports	export	2025-08-14 21:39:52.353692
48	reports:bog_regulatory	reporting	View Bank of Ghana regulatory reports	reports	bog_regulatory	2025-08-14 21:39:52.353692
49	dashboard:view_basic	reporting	View basic dashboard	dashboard	view_basic	2025-08-14 21:39:52.353692
50	dashboard:view_advanced	reporting	View advanced dashboard analytics	dashboard	view_advanced	2025-08-14 21:39:52.353692
51	assets:view	data_access	View assets	assets	view	2025-08-14 21:39:52.353692
52	assets:create	data_access	Create assets	assets	create	2025-08-14 21:39:52.353692
53	assets:edit	data_access	Edit assets	assets	edit	2025-08-14 21:39:52.353692
54	assets:delete	data_access	Delete assets	assets	delete	2025-08-14 21:39:52.353692
55	liabilities:view	data_access	View liabilities	liabilities	view	2025-08-14 21:39:52.353692
56	liabilities:create	data_access	Create liabilities	liabilities	create	2025-08-14 21:39:52.353692
57	liabilities:edit	data_access	Edit liabilities	liabilities	edit	2025-08-14 21:39:52.353692
58	liabilities:delete	data_access	Delete liabilities	liabilities	delete	2025-08-14 21:39:52.353692
59	equity:view	data_access	View equity	equity	view	2025-08-14 21:39:52.353692
60	equity:create	data_access	Create equity	equity	create	2025-08-14 21:39:52.353692
61	equity:edit	data_access	Edit equity	equity	edit	2025-08-14 21:39:52.353692
62	equity:delete	data_access	Delete equity	equity	delete	2025-08-14 21:39:52.353692
63	inventory:view	data_access	View inventory	inventory	view	2025-08-14 21:39:52.353692
64	inventory:create	data_access	Create inventory	inventory	create	2025-08-14 21:39:52.353692
65	inventory:edit	data_access	Edit inventory	inventory	edit	2025-08-14 21:39:52.353692
66	inventory:delete	data_access	Delete inventory	inventory	delete	2025-08-14 21:39:52.353692
\.


--
-- Data for Name: petty_cash; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.petty_cash (id, amount, purpose, date, handled_by, status, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: production_alerts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.production_alerts (id, alert_type, severity, alert_message, tenant_id, table_affected, metric_value, threshold_breached, is_resolved, created_at, resolved_at, resolved_by, resolution_notes) FROM stdin;
\.


--
-- Data for Name: rent_management; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rent_management (id, property_name, tenant_name, monthly_rent, due_date, status, paid_date, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reports (id, report_type, title, content, generated_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
1	1	1	2025-08-14 21:39:57.662369
2	1	2	2025-08-14 21:39:57.662369
3	1	3	2025-08-14 21:39:57.662369
4	1	4	2025-08-14 21:39:57.662369
5	1	5	2025-08-14 21:39:57.662369
6	1	6	2025-08-14 21:39:57.662369
7	1	7	2025-08-14 21:39:57.662369
8	1	8	2025-08-14 21:39:57.662369
9	1	9	2025-08-14 21:39:57.662369
10	1	10	2025-08-14 21:39:57.662369
11	1	11	2025-08-14 21:39:57.662369
12	1	12	2025-08-14 21:39:57.662369
13	1	13	2025-08-14 21:39:57.662369
14	1	14	2025-08-14 21:39:57.662369
15	1	15	2025-08-14 21:39:57.662369
16	1	16	2025-08-14 21:39:57.662369
17	1	17	2025-08-14 21:39:57.662369
18	1	18	2025-08-14 21:39:57.662369
19	1	19	2025-08-14 21:39:57.662369
20	1	20	2025-08-14 21:39:57.662369
21	1	21	2025-08-14 21:39:57.662369
22	1	22	2025-08-14 21:39:57.662369
23	1	23	2025-08-14 21:39:57.662369
24	1	24	2025-08-14 21:39:57.662369
25	1	25	2025-08-14 21:39:57.662369
26	1	26	2025-08-14 21:39:57.662369
27	1	27	2025-08-14 21:39:57.662369
28	1	28	2025-08-14 21:39:57.662369
29	1	29	2025-08-14 21:39:57.662369
30	1	30	2025-08-14 21:39:57.662369
31	1	31	2025-08-14 21:39:57.662369
32	1	32	2025-08-14 21:39:57.662369
33	1	33	2025-08-14 21:39:57.662369
34	1	34	2025-08-14 21:39:57.662369
35	1	35	2025-08-14 21:39:57.662369
36	1	36	2025-08-14 21:39:57.662369
37	1	37	2025-08-14 21:39:57.662369
38	1	38	2025-08-14 21:39:57.662369
39	1	39	2025-08-14 21:39:57.662369
40	1	40	2025-08-14 21:39:57.662369
41	1	41	2025-08-14 21:39:57.662369
42	1	42	2025-08-14 21:39:57.662369
43	1	43	2025-08-14 21:39:57.662369
44	1	44	2025-08-14 21:39:57.662369
45	1	45	2025-08-14 21:39:57.662369
46	1	46	2025-08-14 21:39:57.662369
47	1	47	2025-08-14 21:39:57.662369
48	1	48	2025-08-14 21:39:57.662369
49	1	49	2025-08-14 21:39:57.662369
50	1	50	2025-08-14 21:39:57.662369
51	1	51	2025-08-14 21:39:57.662369
52	1	52	2025-08-14 21:39:57.662369
53	1	53	2025-08-14 21:39:57.662369
54	1	54	2025-08-14 21:39:57.662369
55	1	55	2025-08-14 21:39:57.662369
56	1	56	2025-08-14 21:39:57.662369
57	1	57	2025-08-14 21:39:57.662369
58	1	58	2025-08-14 21:39:57.662369
59	1	59	2025-08-14 21:39:57.662369
60	1	60	2025-08-14 21:39:57.662369
61	1	61	2025-08-14 21:39:57.662369
62	1	62	2025-08-14 21:39:57.662369
63	1	63	2025-08-14 21:39:57.662369
64	1	64	2025-08-14 21:39:57.662369
65	1	65	2025-08-14 21:39:57.662369
66	1	66	2025-08-14 21:39:57.662369
67	2	1	2025-08-14 21:39:59.492227
68	2	2	2025-08-14 21:39:59.492227
69	2	3	2025-08-14 21:39:59.492227
70	2	4	2025-08-14 21:39:59.492227
71	2	5	2025-08-14 21:39:59.492227
72	2	6	2025-08-14 21:39:59.492227
73	2	7	2025-08-14 21:39:59.492227
74	2	8	2025-08-14 21:39:59.492227
75	2	9	2025-08-14 21:39:59.492227
76	2	10	2025-08-14 21:39:59.492227
77	2	11	2025-08-14 21:39:59.492227
78	2	12	2025-08-14 21:39:59.492227
79	2	13	2025-08-14 21:39:59.492227
80	2	14	2025-08-14 21:39:59.492227
81	2	15	2025-08-14 21:39:59.492227
82	2	16	2025-08-14 21:39:59.492227
83	2	17	2025-08-14 21:39:59.492227
84	2	18	2025-08-14 21:39:59.492227
85	2	19	2025-08-14 21:39:59.492227
86	2	20	2025-08-14 21:39:59.492227
87	2	21	2025-08-14 21:39:59.492227
88	2	22	2025-08-14 21:39:59.492227
89	2	23	2025-08-14 21:39:59.492227
90	2	24	2025-08-14 21:39:59.492227
91	2	25	2025-08-14 21:39:59.492227
92	2	26	2025-08-14 21:39:59.492227
93	2	27	2025-08-14 21:39:59.492227
94	2	28	2025-08-14 21:39:59.492227
95	2	29	2025-08-14 21:39:59.492227
96	2	30	2025-08-14 21:39:59.492227
97	2	31	2025-08-14 21:39:59.492227
98	2	32	2025-08-14 21:39:59.492227
99	2	33	2025-08-14 21:39:59.492227
100	2	34	2025-08-14 21:39:59.492227
101	2	35	2025-08-14 21:39:59.492227
102	2	36	2025-08-14 21:39:59.492227
103	2	37	2025-08-14 21:39:59.492227
104	2	38	2025-08-14 21:39:59.492227
105	2	39	2025-08-14 21:39:59.492227
106	2	40	2025-08-14 21:39:59.492227
107	2	41	2025-08-14 21:39:59.492227
108	2	44	2025-08-14 21:39:59.492227
109	2	45	2025-08-14 21:39:59.492227
110	2	46	2025-08-14 21:39:59.492227
111	2	47	2025-08-14 21:39:59.492227
112	2	48	2025-08-14 21:39:59.492227
113	2	49	2025-08-14 21:39:59.492227
114	2	50	2025-08-14 21:39:59.492227
115	2	51	2025-08-14 21:39:59.492227
116	2	52	2025-08-14 21:39:59.492227
117	2	53	2025-08-14 21:39:59.492227
118	2	54	2025-08-14 21:39:59.492227
119	2	55	2025-08-14 21:39:59.492227
120	2	56	2025-08-14 21:39:59.492227
121	2	57	2025-08-14 21:39:59.492227
122	2	58	2025-08-14 21:39:59.492227
123	2	59	2025-08-14 21:39:59.492227
124	2	60	2025-08-14 21:39:59.492227
125	2	61	2025-08-14 21:39:59.492227
126	2	62	2025-08-14 21:39:59.492227
127	2	63	2025-08-14 21:39:59.492227
128	2	64	2025-08-14 21:39:59.492227
129	2	65	2025-08-14 21:39:59.492227
130	2	66	2025-08-14 21:39:59.492227
131	3	1	2025-08-14 21:40:01.473102
132	3	2	2025-08-14 21:40:01.473102
133	3	3	2025-08-14 21:40:01.473102
134	3	4	2025-08-14 21:40:01.473102
135	3	5	2025-08-14 21:40:01.473102
136	3	6	2025-08-14 21:40:01.473102
137	3	7	2025-08-14 21:40:01.473102
138	3	8	2025-08-14 21:40:01.473102
139	3	9	2025-08-14 21:40:01.473102
140	3	10	2025-08-14 21:40:01.473102
141	3	11	2025-08-14 21:40:01.473102
142	3	12	2025-08-14 21:40:01.473102
143	3	13	2025-08-14 21:40:01.473102
144	3	14	2025-08-14 21:40:01.473102
145	3	15	2025-08-14 21:40:01.473102
146	3	16	2025-08-14 21:40:01.473102
147	3	17	2025-08-14 21:40:01.473102
148	3	18	2025-08-14 21:40:01.473102
149	3	19	2025-08-14 21:40:01.473102
150	3	20	2025-08-14 21:40:01.473102
151	3	21	2025-08-14 21:40:01.473102
152	3	22	2025-08-14 21:40:01.473102
153	3	23	2025-08-14 21:40:01.473102
154	3	24	2025-08-14 21:40:01.473102
155	3	25	2025-08-14 21:40:01.473102
156	3	26	2025-08-14 21:40:01.473102
157	3	27	2025-08-14 21:40:01.473102
158	3	28	2025-08-14 21:40:01.473102
159	3	29	2025-08-14 21:40:01.473102
160	3	30	2025-08-14 21:40:01.473102
161	3	31	2025-08-14 21:40:01.473102
162	3	32	2025-08-14 21:40:01.473102
163	3	33	2025-08-14 21:40:01.473102
164	3	34	2025-08-14 21:40:01.473102
165	3	35	2025-08-14 21:40:01.473102
166	3	36	2025-08-14 21:40:01.473102
167	3	37	2025-08-14 21:40:01.473102
168	3	41	2025-08-14 21:40:01.473102
169	3	44	2025-08-14 21:40:01.473102
170	3	45	2025-08-14 21:40:01.473102
171	3	46	2025-08-14 21:40:01.473102
172	3	47	2025-08-14 21:40:01.473102
173	3	48	2025-08-14 21:40:01.473102
174	3	49	2025-08-14 21:40:01.473102
175	3	50	2025-08-14 21:40:01.473102
176	3	51	2025-08-14 21:40:01.473102
177	3	52	2025-08-14 21:40:01.473102
178	3	53	2025-08-14 21:40:01.473102
179	3	54	2025-08-14 21:40:01.473102
180	3	55	2025-08-14 21:40:01.473102
181	3	56	2025-08-14 21:40:01.473102
182	3	57	2025-08-14 21:40:01.473102
183	3	58	2025-08-14 21:40:01.473102
184	3	59	2025-08-14 21:40:01.473102
185	3	60	2025-08-14 21:40:01.473102
186	3	61	2025-08-14 21:40:01.473102
187	3	62	2025-08-14 21:40:01.473102
188	3	63	2025-08-14 21:40:01.473102
189	3	64	2025-08-14 21:40:01.473102
190	3	65	2025-08-14 21:40:01.473102
191	3	66	2025-08-14 21:40:01.473102
192	4	1	2025-08-14 21:40:04.244744
193	4	2	2025-08-14 21:40:04.244744
194	4	3	2025-08-14 21:40:04.244744
195	4	5	2025-08-14 21:40:04.244744
196	4	6	2025-08-14 21:40:04.244744
197	4	7	2025-08-14 21:40:04.244744
198	4	8	2025-08-14 21:40:04.244744
199	4	10	2025-08-14 21:40:04.244744
200	4	11	2025-08-14 21:40:04.244744
201	4	18	2025-08-14 21:40:04.244744
202	4	19	2025-08-14 21:40:04.244744
203	4	21	2025-08-14 21:40:04.244744
204	4	22	2025-08-14 21:40:04.244744
205	4	23	2025-08-14 21:40:04.244744
206	4	24	2025-08-14 21:40:04.244744
207	4	26	2025-08-14 21:40:04.244744
208	4	27	2025-08-14 21:40:04.244744
209	4	28	2025-08-14 21:40:04.244744
210	4	30	2025-08-14 21:40:04.244744
211	4	31	2025-08-14 21:40:04.244744
212	4	32	2025-08-14 21:40:04.244744
213	4	51	2025-08-14 21:40:04.244744
214	4	52	2025-08-14 21:40:04.244744
215	4	53	2025-08-14 21:40:04.244744
216	4	55	2025-08-14 21:40:04.244744
217	4	56	2025-08-14 21:40:04.244744
218	4	57	2025-08-14 21:40:04.244744
219	4	59	2025-08-14 21:40:04.244744
220	4	60	2025-08-14 21:40:04.244744
221	4	61	2025-08-14 21:40:04.244744
222	4	63	2025-08-14 21:40:04.244744
223	4	64	2025-08-14 21:40:04.244744
224	4	65	2025-08-14 21:40:04.244744
225	4	44	2025-08-14 21:40:05.89384
226	4	49	2025-08-14 21:40:05.89384
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, description, hierarchy_level, is_system_role, tenant_id, created_at, updated_at) FROM stdin;
1	super_admin	System Super Administrator with cross-tenant access	1	t	\N	2025-08-14 21:39:30.18164	2025-08-14 21:39:30.18164
2	admin	Tenant Administrator with full tenant access	2	t	\N	2025-08-14 21:39:30.18164	2025-08-14 21:39:30.18164
3	manager	Tenant Manager with operational access	3	t	\N	2025-08-14 21:39:30.18164	2025-08-14 21:39:30.18164
4	staff	Staff with basic operational access	4	t	\N	2025-08-14 21:39:30.18164	2025-08-14 21:39:30.18164
\.


--
-- Data for Name: shareholders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shareholders (id, shareholder_type, name, nationality, id_type, id_number, address, contact_phone, contact_email, shares_owned, share_percentage, investment_amount, investment_currency, gipc_certificate, is_active, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, first_name, last_name, email, phone, "position", salary, hire_date, status, created_at, updated_at, tenant_id) FROM stdin;
6	Sarah	Mensah	s.mensah@ghanams.com	+233-20-111-2222	Loan Officer	3500.00	2024-01-15 00:00:00	active	2025-08-14 23:59:37.163022	2025-08-14 23:59:37.163022	default-tenant-001
7	David	Owusu	d.owusu@ghanams.com	+233-20-333-4444	Credit Analyst	4200.00	2024-02-01 00:00:00	active	2025-08-14 23:59:37.163022	2025-08-14 23:59:37.163022	default-tenant-001
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_messages (id, tenant_id, ticket_id, sender_type, sender_id, message, created_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_tickets (id, tenant_id, customer_id, title, description, status, priority, category, assigned_to, created_at, updated_at, customer_email, customer_phone, resolution, resolved_at) FROM stdin;
1	default-tenant-001	21	Test Support Issue	This is a test support ticket to verify the system works	open	medium	general	\N	2025-08-28 19:57:50.093849	2025-08-28 19:57:50.093849	test@example.com	\N	\N	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (id, name, slug, settings, created_at, updated_at) FROM stdin;
default-tenant-001	Default Tenant	default-tenant-001	{"theme": "light", "features": ["loans", "payments", "analytics"]}	2025-08-13 13:41:21.423043	2025-09-02 11:42:23.031
default	Default System Tenant	default	{"theme": "light", "features": ["loans", "payments", "analytics"]}	2025-09-02 11:51:48.715659	2025-09-02 11:51:48.715659
test-tenant-001	ABC Microfinance Ltd	abc-microfinance	{"theme": "light", "locale": "en-GH", "currency": "GHS", "features": ["loans", "payments", "analytics"]}	2025-09-11 13:13:05.605267	2025-09-11 13:13:05.605267
test-tenant-002	XYZ Credit Union	xyz-credit-union	{"theme": "dark", "locale": "en-US", "currency": "USD", "features": ["loans", "payments", "analytics", "inventory"]}	2025-09-11 13:13:05.605267	2025-09-11 13:13:05.605267
test-tenant-003	Global Finance Co	global-finance	{"theme": "light", "locale": "en-EU", "currency": "EUR", "features": ["loans", "payments", "analytics", "assets"]}	2025-09-11 13:13:05.605267	2025-09-11 13:13:05.605267
\.


--
-- Data for Name: user_audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_audit_logs (id, user_id, action, description, ip_address, user_agent, "timestamp", tenant_id) FROM stdin;
1	1	profile_update	Profile picture updated	172.31.128.142	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-11 10:05:37.059402	default-tenant-001
2	1	profile_update	User profile updated	172.31.128.142	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-11 10:07:17.069499	default-tenant-001
3	1	user_role_change	Admin changed user role to 'user' for user with ID: 2	172.31.128.142	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-11 10:14:31.168907	default-tenant-001
4	1	profile_update	Profile picture updated	172.31.128.142	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-11 10:20:48.941085	default-tenant-001
5	1	login	User logged in successfully	172.31.128.142	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-11 10:48:46.031051	default-tenant-001
6	1	login	User logged in successfully	172.31.128.78	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-14 13:11:52.818382	default-tenant-001
7	1	login	User logged in successfully	172.31.128.96	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-15 12:00:09.366088	default-tenant-001
8	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-07-15 12:15:17.028772	default-tenant-001
9	1	login	User logged in successfully	172.31.128.96	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-15 12:40:29.164069	default-tenant-001
10	1	login	User logged in successfully	172.31.128.96	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-15 13:00:33.321878	default-tenant-001
11	1	login	User logged in successfully	172.31.128.9	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-16 13:15:23.405131	default-tenant-001
12	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-07-16 13:38:01.165568	default-tenant-001
13	1	login	User logged in successfully	172.31.128.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2025-07-18 12:23:22.146267	default-tenant-001
14	1	login	User logged in successfully	172.31.96.130	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-12 00:35:11.463671	default-tenant-001
15	1	login	User logged in successfully	172.31.96.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 12:35:03.322692	default-tenant-001
16	1	login	User logged in successfully	172.31.96.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 13:03:11.124085	default-tenant-001
17	1	login	User logged in successfully	172.31.99.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 14:02:07.407865	default-tenant-001
18	1	login	User logged in successfully	172.31.109.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-14 17:01:42.215035	default-tenant-001
19	1	login	User logged in successfully	172.31.80.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-14 21:54:14.079495	default-tenant-001
20	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-14 21:56:16.243724	default-tenant-001
21	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-14 22:25:21.12798	default-tenant-001
22	1	login	User logged in successfully	172.31.88.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 10:08:56.453416	default-tenant-001
23	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:54:28.439142	default-tenant-001
24	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:54:37.280108	default-tenant-001
25	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:54:54.259732	default-tenant-001
26	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:55:03.897776	default-tenant-001
27	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:56:31.108631	default-tenant-001
28	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:56:34.068382	default-tenant-001
29	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:56:52.959743	default-tenant-001
30	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:57:05.369594	default-tenant-001
31	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:57:07.493143	default-tenant-001
32	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:57:16.006879	default-tenant-001
33	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 10:59:40.388369	default-tenant-001
34	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:00:03.660579	default-tenant-001
35	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:01:44.273996	default-tenant-001
36	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:01:51.096851	default-tenant-001
37	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:02:05.418706	default-tenant-001
38	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:05:19.766223	default-tenant-001
39	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:08:31.731417	default-tenant-001
40	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-08-18 11:26:14.73413	default-tenant-001
41	1	profile_update	Profile picture updated	172.31.88.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 12:27:07.708135	default-tenant-001
42	1	user_role_change	Admin changed user role to 'manager' for user with ID: 3	172.31.88.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 12:32:41.487748	default-tenant-001
43	1	user_role_change	Admin changed user role to 'manager' for user with ID: 2	172.31.88.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-18 12:32:53.302736	default-tenant-001
44	1	login	User logged in successfully	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 01:57:40.820126	default-tenant-001
45	1	login	User logged in successfully	172.31.93.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 22:54:59.013957	default-tenant-001
46	1	login	User logged in successfully	172.31.117.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 19:33:25.845011	default-tenant-001
47	1	login	User logged in successfully	172.31.117.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 19:27:12.864453	default-tenant-001
48	1	login	User logged in successfully	172.31.117.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 20:37:46.921336	default-tenant-001
49	1	login	User logged in successfully	172.31.117.194	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 20:41:57.339274	default-tenant-001
50	1	login	User logged in successfully	172.31.69.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 12:19:54.54041	default-tenant-001
51	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 19:22:46.222466	default-tenant-001
52	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 19:48:59.602993	default-tenant-001
53	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 19:56:26.954494	default-tenant-001
54	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:05:41.407353	default-tenant-001
55	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:35:00.484357	default-tenant-001
56	1	login	User logged in successfully	172.31.83.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 21:35:31.109312	default-tenant-001
57	1	login	User logged in successfully	172.31.120.130	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 08:48:43.38105	default-tenant-001
58	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 09:59:51.552122	default-tenant-001
59	1	login	User logged in successfully	172.31.120.130	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 10:00:46.746043	default-tenant-001
60	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:08:04.224129	default-tenant-001
61	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:09:27.093766	default-tenant-001
62	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:10:17.305315	default-tenant-001
63	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:12:24.023692	default-tenant-001
64	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:14:03.72747	default-tenant-001
65	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:18:57.321833	default-tenant-001
66	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:23:30.41178	default-tenant-001
67	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:28:44.223986	default-tenant-001
68	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:33:45.443468	default-tenant-001
69	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:33:57.319812	default-tenant-001
70	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:34:08.919606	default-tenant-001
71	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:34:24.420968	default-tenant-001
72	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:35:04.94825	default-tenant-001
73	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:41:50.566824	default-tenant-001
74	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:42:10.54189	default-tenant-001
75	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:42:12.553715	default-tenant-001
76	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:43:01.166983	default-tenant-001
77	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:43:10.029572	default-tenant-001
78	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:43:34.165367	default-tenant-001
79	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:44:30.340948	default-tenant-001
80	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:44:43.369775	default-tenant-001
81	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:49:14.816464	default-tenant-001
82	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:49:15.767835	default-tenant-001
83	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:50:14.081827	default-tenant-001
84	7	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-02 10:50:17.367042	default-tenant-001
85	1	login	User logged in successfully	172.31.118.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-09 08:34:34.530325	default
86	1	login	User logged in successfully	127.0.0.1	curl/8.14.1	2025-09-11 12:49:41.958559	default
87	1	login	User logged in successfully	172.31.107.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-11 13:53:47.450243	default
88	7	login	User logged in successfully	172.31.64.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:20:19.124738	default-tenant-001
89	15	login	User logged in successfully	172.31.64.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:23:47.951511	default-tenant-001
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_roles (id, user_id, role_id, tenant_id, assigned_by, assigned_at, is_active) FROM stdin;
1	3	4	default-tenant-001	\N	2025-08-14 21:40:16.856812	t
3	5	4	default-tenant-001	\N	2025-08-14 21:40:16.856812	t
4	1	1	default-tenant-001	\N	2025-08-14 21:40:16.856812	t
2	2	2	default-tenant-001	1	2025-09-02 10:37:46.751	t
\.


--
-- Data for Name: user_tenant_access; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_tenant_access (id, user_id, tenant_id, role, permissions, created_at) FROM stdin;
1	16	test-tenant-001	manager	{loans:read,customers:read,loans:write,customers:write}	2025-09-11 13:17:45.094962
2	16	test-tenant-002	user	{loans:read,customers:read}	2025-09-11 13:17:45.094962
3	16	test-tenant-003	user	{loans:read,customers:read}	2025-09-11 13:17:45.094962
4	15	test-tenant-001	super_admin	{*:*}	2025-09-11 13:17:45.094962
5	15	test-tenant-002	super_admin	{*:*}	2025-09-11 13:17:45.094962
6	15	test-tenant-003	super_admin	{*:*}	2025-09-11 13:17:45.094962
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, role, created_at, updated_at, profile_picture, first_name, last_name, phone, last_login, is_active, tenant_id, is_super_admin) FROM stdin;
8	abc_admin	$2b$10$123hash	admin@abc-micro.com	admin	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	John	Admin	+233123456789	\N	t	test-tenant-001	f
9	abc_manager	$2b$10$123hash	manager@abc-micro.com	manager	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Jane	Manager	+233123456790	\N	t	test-tenant-001	f
10	abc_staff	$2b$10$123hash	staff@abc-micro.com	user	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Mike	Staff	+233123456791	\N	t	test-tenant-001	f
11	xyz_admin	$2b$10$123hash	admin@xyz-credit.com	admin	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Sarah	Johnson	+1234567890	\N	t	test-tenant-002	f
12	xyz_manager	$2b$10$123hash	manager@xyz-credit.com	manager	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Tom	Wilson	+1234567891	\N	t	test-tenant-002	f
13	global_admin	$2b$10$123hash	admin@global-finance.com	admin	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Emma	Brown	+4412345678	\N	t	test-tenant-003	f
5	tenant-user	$2b$10$DBMBxqnexRiIHdkrUj/41OyWO8hmj/FAqXBdWyJupQv2MhSct2p2u	tenant@test.com	user	2025-08-13 13:59:09.411217	2025-08-13 13:59:09.411217	\N	\N	\N	\N	\N	t	default-tenant-001	f
3	user	$2b$10$Yof7s5y6HzWoSsbECU1yweB.5qt2gQRleE8fk5bikEB3GVjVws.v6	user@financeflow.com	manager	2025-07-10 13:40:48.411446	2025-08-18 12:32:41.424	\N	\N	\N	\N	\N	t	default-tenant-001	f
2	manager	$2b$10$vpSARi1rPVIPjvlzWm25WuRWyMk4QCPeGh2g78wX3bdSjQUCFR9fO	manager@financeflow.com	manager	2025-07-10 13:40:48.411446	2025-08-18 12:32:53.266	\N	\N	\N	\N	\N	t	default-tenant-001	f
14	global_staff	$2b$10$123hash	staff@global-finance.com	user	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	David	Smith	+4412345679	\N	t	test-tenant-003	f
16	multitenant_user	$2b$10$123hash	multi@example.com	manager	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	Alex	Multi	+555123456	\N	t	test-tenant-001	f
7	test	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	test@example.com	user	2025-09-02 09:59:07.69486	2025-09-02 10:50:17.33	\N	\N	\N	\N	2025-09-02 10:50:17.33	t	default-tenant-001	f
15	superadmin	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	superadmin@moneyflow.app	super_admin	2025-09-11 13:13:13.027258	2025-09-11 13:13:13.027258	\N	System	Administrator	+1000000000	\N	t	default-tenant-001	t
1	admin	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	admin@financeflow.com	admin	2025-07-10 13:34:58.845079	2025-09-11 13:53:47.402	/uploads/profile-1755520027421-379627341.jpeg	Kwame	Bonsu	0203901772	2025-09-11 13:53:47.402	t	default-tenant-001	t
\.


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.assets_id_seq', 1, false);


--
-- Name: backup_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.backup_metadata_id_seq', 1, false);


--
-- Name: bank_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bank_management_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 29, true);


--
-- Name: data_retention_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.data_retention_policies_id_seq', 4, true);


--
-- Name: database_health_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.database_health_metrics_id_seq', 1, false);


--
-- Name: database_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.database_migrations_id_seq', 5, true);


--
-- Name: equity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.equity_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expenses_id_seq', 4, true);


--
-- Name: income_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.income_management_id_seq', 34, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_id_seq', 2, true);


--
-- Name: liabilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.liabilities_id_seq', 1, false);


--
-- Name: loan_books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.loan_books_id_seq', 29, true);


--
-- Name: loan_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.loan_products_id_seq', 8, true);


--
-- Name: mfi_registration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mfi_registration_id_seq', 2, true);


--
-- Name: payment_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payment_schedules_id_seq', 274, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 66, true);


--
-- Name: petty_cash_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.petty_cash_id_seq', 1, true);


--
-- Name: production_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.production_alerts_id_seq', 1, false);


--
-- Name: rent_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.rent_management_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 226, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: shareholders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shareholders_id_seq', 5, true);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 7, true);


--
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.support_messages_id_seq', 1, false);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 1, true);


--
-- Name: user_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_audit_logs_id_seq', 89, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 4, true);


--
-- Name: user_tenant_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_tenant_access_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: backup_metadata backup_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.backup_metadata
    ADD CONSTRAINT backup_metadata_pkey PRIMARY KEY (id);


--
-- Name: bank_management bank_management_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bank_management
    ADD CONSTRAINT bank_management_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_unique UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: data_retention_policies data_retention_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.data_retention_policies
    ADD CONSTRAINT data_retention_policies_pkey PRIMARY KEY (id);


--
-- Name: database_health_metrics database_health_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_health_metrics
    ADD CONSTRAINT database_health_metrics_pkey PRIMARY KEY (id);


--
-- Name: database_migrations database_migrations_migration_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_migrations
    ADD CONSTRAINT database_migrations_migration_name_key UNIQUE (migration_name);


--
-- Name: database_migrations database_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_migrations
    ADD CONSTRAINT database_migrations_pkey PRIMARY KEY (id);


--
-- Name: equity equity_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equity
    ADD CONSTRAINT equity_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: income_management income_management_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.income_management
    ADD CONSTRAINT income_management_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: liabilities liabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.liabilities
    ADD CONSTRAINT liabilities_pkey PRIMARY KEY (id);


--
-- Name: loan_books loan_books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_pkey PRIMARY KEY (id);


--
-- Name: loan_products loan_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT loan_products_pkey PRIMARY KEY (id);


--
-- Name: mfi_registration mfi_registration_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfi_registration
    ADD CONSTRAINT mfi_registration_pkey PRIMARY KEY (id);


--
-- Name: mfi_registration mfi_registration_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfi_registration
    ADD CONSTRAINT mfi_registration_registration_number_key UNIQUE (registration_number);


--
-- Name: payment_schedules payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: petty_cash petty_cash_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT petty_cash_pkey PRIMARY KEY (id);


--
-- Name: production_alerts production_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.production_alerts
    ADD CONSTRAINT production_alerts_pkey PRIMARY KEY (id);


--
-- Name: rent_management rent_management_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rent_management
    ADD CONSTRAINT rent_management_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_tenant_id_key UNIQUE (name, tenant_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: shareholders shareholders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shareholders
    ADD CONSTRAINT shareholders_pkey PRIMARY KEY (id);


--
-- Name: staff staff_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_email_unique UNIQUE (email);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: user_audit_logs user_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_audit_logs
    ADD CONSTRAINT user_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_tenant_id_key UNIQUE (user_id, tenant_id);


--
-- Name: user_tenant_access user_tenant_access_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_tenant_access
    ADD CONSTRAINT user_tenant_access_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_assets_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_assets_tenant_id ON public.assets USING btree (tenant_id);


--
-- Name: idx_assets_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_assets_tenant_status ON public.assets USING btree (tenant_id, status);


--
-- Name: idx_bank_management_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_bank_management_tenant_id ON public.bank_management USING btree (tenant_id);


--
-- Name: idx_bank_management_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_bank_management_tenant_status ON public.bank_management USING btree (tenant_id, status);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_customers_tenant_id ON public.customers USING btree (tenant_id);


--
-- Name: idx_equity_tenant_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_equity_tenant_date ON public.equity USING btree (tenant_id, date);


--
-- Name: idx_equity_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_equity_tenant_id ON public.equity USING btree (tenant_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (date DESC);


--
-- Name: idx_expenses_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_expenses_tenant_id ON public.expenses USING btree (tenant_id);


--
-- Name: idx_health_metrics_tenant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_health_metrics_tenant ON public.database_health_metrics USING btree (tenant_id, measurement_time DESC);


--
-- Name: idx_health_metrics_time; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_health_metrics_time ON public.database_health_metrics USING btree (measurement_time DESC);


--
-- Name: idx_income_management_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_income_management_date ON public.income_management USING btree (date DESC);


--
-- Name: idx_income_management_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_income_management_tenant_id ON public.income_management USING btree (tenant_id);


--
-- Name: idx_inventory_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_inventory_tenant_id ON public.inventory USING btree (tenant_id);


--
-- Name: idx_inventory_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_inventory_tenant_status ON public.inventory USING btree (tenant_id, status);


--
-- Name: idx_liabilities_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_liabilities_tenant_id ON public.liabilities USING btree (tenant_id);


--
-- Name: idx_liabilities_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_liabilities_tenant_status ON public.liabilities USING btree (tenant_id, status);


--
-- Name: idx_loan_books_assigned_officer; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_assigned_officer ON public.loan_books USING btree (assigned_officer);


--
-- Name: idx_loan_books_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_created_at ON public.loan_books USING btree (created_at DESC);


--
-- Name: idx_loan_books_customer_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_customer_id ON public.loan_books USING btree (customer_id);


--
-- Name: idx_loan_books_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_status ON public.loan_books USING btree (status);


--
-- Name: idx_loan_books_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_tenant_id ON public.loan_books USING btree (tenant_id);


--
-- Name: idx_loan_books_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_books_tenant_status ON public.loan_books USING btree (tenant_id, status);


--
-- Name: idx_loan_products_tenant_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_products_tenant_active ON public.loan_products USING btree (tenant_id, is_active);


--
-- Name: idx_loan_products_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_loan_products_tenant_id ON public.loan_products USING btree (tenant_id);


--
-- Name: idx_mfi_registration_tenant_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mfi_registration_tenant_active ON public.mfi_registration USING btree (tenant_id, is_active);


--
-- Name: idx_mfi_registration_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mfi_registration_tenant_id ON public.mfi_registration USING btree (tenant_id);


--
-- Name: idx_payment_schedules_due_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_due_date ON public.payment_schedules USING btree (due_date);


--
-- Name: idx_payment_schedules_loan_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_loan_id ON public.payment_schedules USING btree (loan_id);


--
-- Name: idx_payment_schedules_loan_id_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_loan_id_status ON public.payment_schedules USING btree (loan_id, status);


--
-- Name: idx_payment_schedules_paid_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_paid_date ON public.payment_schedules USING btree (paid_date DESC);


--
-- Name: idx_payment_schedules_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_status ON public.payment_schedules USING btree (status);


--
-- Name: idx_payment_schedules_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_tenant_id ON public.payment_schedules USING btree (tenant_id);


--
-- Name: idx_payment_schedules_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_schedules_tenant_status ON public.payment_schedules USING btree (tenant_id, status);


--
-- Name: idx_petty_cash_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_petty_cash_tenant_id ON public.petty_cash USING btree (tenant_id);


--
-- Name: idx_petty_cash_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_petty_cash_tenant_status ON public.petty_cash USING btree (tenant_id, status);


--
-- Name: idx_production_alerts_severity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_production_alerts_severity ON public.production_alerts USING btree (severity, created_at DESC);


--
-- Name: idx_production_alerts_unresolved; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_production_alerts_unresolved ON public.production_alerts USING btree (created_at DESC) WHERE (is_resolved = false);


--
-- Name: idx_rent_management_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_rent_management_tenant_id ON public.rent_management USING btree (tenant_id);


--
-- Name: idx_rent_management_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_rent_management_tenant_status ON public.rent_management USING btree (tenant_id, status);


--
-- Name: idx_reports_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reports_tenant_id ON public.reports USING btree (tenant_id);


--
-- Name: idx_reports_tenant_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reports_tenant_type ON public.reports USING btree (tenant_id, report_type);


--
-- Name: idx_shareholders_tenant_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_shareholders_tenant_active ON public.shareholders USING btree (tenant_id, is_active);


--
-- Name: idx_shareholders_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_shareholders_tenant_id ON public.shareholders USING btree (tenant_id);


--
-- Name: idx_staff_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_staff_tenant_id ON public.staff USING btree (tenant_id);


--
-- Name: idx_staff_tenant_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_staff_tenant_status ON public.staff USING btree (tenant_id, status);


--
-- Name: idx_user_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_audit_logs_tenant_id ON public.user_audit_logs USING btree (tenant_id);


--
-- Name: idx_user_audit_logs_tenant_timestamp; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_audit_logs_tenant_timestamp ON public.user_audit_logs USING btree (tenant_id, "timestamp");


--
-- Name: idx_user_roles_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_roles_tenant_id ON public.user_roles USING btree (tenant_id);


--
-- Name: idx_user_roles_tenant_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_roles_tenant_user ON public.user_roles USING btree (tenant_id, user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: assets fk_assets_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fk_assets_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: bank_management fk_bank_management_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bank_management
    ADD CONSTRAINT fk_bank_management_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers fk_customers_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: equity fk_equity_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.equity
    ADD CONSTRAINT fk_equity_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: expenses fk_expenses_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT fk_expenses_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: income_management fk_income_management_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.income_management
    ADD CONSTRAINT fk_income_management_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: inventory fk_inventory_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: liabilities fk_liabilities_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.liabilities
    ADD CONSTRAINT fk_liabilities_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: loan_books fk_loan_books_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT fk_loan_books_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: loan_products fk_loan_products_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT fk_loan_products_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: mfi_registration fk_mfi_registration_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfi_registration
    ADD CONSTRAINT fk_mfi_registration_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payment_schedules fk_payment_schedules_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT fk_payment_schedules_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: petty_cash fk_petty_cash_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rent_management fk_rent_management_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rent_management
    ADD CONSTRAINT fk_rent_management_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: reports fk_reports_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: roles fk_roles_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: shareholders fk_shareholders_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shareholders
    ADD CONSTRAINT fk_shareholders_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: staff fk_staff_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT fk_staff_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_audit_logs fk_user_audit_logs_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_audit_logs
    ADD CONSTRAINT fk_user_audit_logs_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: users fk_users_tenant_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: loan_books loan_books_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: loan_books loan_books_assigned_officer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_assigned_officer_fkey FOREIGN KEY (assigned_officer) REFERENCES public.users(id);


--
-- Name: loan_books loan_books_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: loan_books loan_books_disbursed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_disbursed_by_fkey FOREIGN KEY (disbursed_by) REFERENCES public.users(id);


--
-- Name: loan_books loan_books_loan_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loan_books
    ADD CONSTRAINT loan_books_loan_product_id_fkey FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id);


--
-- Name: payment_schedules payment_schedules_loan_id_loan_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_loan_id_loan_books_id_fk FOREIGN KEY (loan_id) REFERENCES public.loan_books(id);


--
-- Name: petty_cash petty_cash_handled_by_staff_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT petty_cash_handled_by_staff_id_fk FOREIGN KEY (handled_by) REFERENCES public.staff(id);


--
-- Name: reports reports_generated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_generated_by_users_id_fk FOREIGN KEY (generated_by) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: user_audit_logs user_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_audit_logs
    ADD CONSTRAINT user_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_tenant_access user_tenant_access_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_tenant_access
    ADD CONSTRAINT user_tenant_access_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: bank_management; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.bank_management ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: equity; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.equity ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: income_management; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.income_management ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: liabilities; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_books; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.loan_books ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_products; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;

--
-- Name: mfi_registration; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.mfi_registration ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_schedules; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: petty_cash; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;

--
-- Name: rent_management; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.rent_management ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: shareholders; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;

--
-- Name: staff; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

--
-- Name: assets tenant_isolation_assets; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_assets ON public.assets USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: bank_management tenant_isolation_bank_management; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_bank_management ON public.bank_management USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: customers tenant_isolation_customers; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_customers ON public.customers USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: equity tenant_isolation_equity; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_equity ON public.equity USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: expenses tenant_isolation_expenses; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_expenses ON public.expenses USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: income_management tenant_isolation_income_management; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_income_management ON public.income_management USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: inventory tenant_isolation_inventory; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_inventory ON public.inventory USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: liabilities tenant_isolation_liabilities; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_liabilities ON public.liabilities USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: loan_books tenant_isolation_loan_books; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_loan_books ON public.loan_books USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: loan_products tenant_isolation_loan_products; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_loan_products ON public.loan_products USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: mfi_registration tenant_isolation_mfi_registration; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_mfi_registration ON public.mfi_registration USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: payment_schedules tenant_isolation_payment_schedules; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_payment_schedules ON public.payment_schedules USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: petty_cash tenant_isolation_petty_cash; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_petty_cash ON public.petty_cash USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: rent_management tenant_isolation_rent_management; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_rent_management ON public.rent_management USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: reports tenant_isolation_reports; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_reports ON public.reports USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: roles tenant_isolation_roles; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_roles ON public.roles USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: shareholders tenant_isolation_shareholders; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_shareholders ON public.shareholders USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: staff tenant_isolation_staff; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_staff ON public.staff USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: user_audit_logs tenant_isolation_user_audit_logs; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_user_audit_logs ON public.user_audit_logs USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: user_roles tenant_isolation_user_roles; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_user_roles ON public.user_roles USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: users tenant_isolation_users; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY tenant_isolation_users ON public.users USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: user_audit_logs; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

