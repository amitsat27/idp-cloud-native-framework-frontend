export interface ExecutionPlan {
  app_name: string;
  image?: string | null;
  replicas: number;
  target_namespace: string;
  action: 'create' | 'update' | 'delete' | 'create_namespace' | 'delete_namespace';
  reasoning: string;
  summary?: string;
  service_port?: number;
  container_port?: number;
  autoscaling?: any;
  networking?: any;
  resources?: any;
  storage_gb?: number;
  secret_data?: Record<string, string>;
  resource_kind?: 'deployment' | 'statefulset';
}

export interface ReplicaCapacity {
  requested: number;
  deployed: number;
  max_possible: number | null;
  adjusted: boolean;
  reason: string | null;
}

export interface ClusterCapacity {
  total_cpu_milli: number;
  used_cpu_milli: number;
  total_mem_mib: number;
  used_mem_mib: number;
}

export interface AvailableCapacity {
  cpu_milli: number;
  memory_mib: number;
  safety_margin: number;
}

export interface PodRequirements {
  cpu_milli: number;
  memory_mib: number;
  cpu_human: string;
  memory_human: string;
}

export interface CapacityInfo {
  pod_requirements?: PodRequirements;
  cluster_capacity?: ClusterCapacity;
  available_capacity?: AvailableCapacity;
  max_by_cpu?: number;
  max_by_memory?: number;
  replicas?: ReplicaCapacity;
}

export interface ExecutionResult {
  status: string;
  namespace: string;
  execution_logs: string[];
  manifests: Record<string, string>;
  capacity?: CapacityInfo;
  warnings?: string[];
}

export interface IntentResponse {
  intent_received: string;
  target_namespace: string;
  orchestration_plan: ExecutionPlan;
  execution: {
    execution_logs: string[];
    status: string;
    results?: ExecutionResult[];
    manifests?: Record<string, string>;
    verification?: any[];
  };
  capacity_warnings?: string[];
}