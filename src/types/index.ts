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
  autoscaling: number;
  networking: number;
}

export interface IntentResponse {
  intent_received: string;
  target_namespace: string;
  orchestration_plan: ExecutionPlan;
  execution: {
    execution_logs: string[];
    status: string;
    verification?: any[];
  };
}