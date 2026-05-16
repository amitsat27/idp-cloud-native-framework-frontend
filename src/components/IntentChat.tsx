import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Button, Typography, IconButton, Box, Fade, Skeleton, Tab, Tabs,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, Divider, CircularProgress, LinearProgress, Chip
} from "@mui/material";
import {
  SendRounded, ChevronLeftRounded, ChevronRightRounded, AutoAwesomeRounded,
  CodeRounded, AccountTreeRounded, RocketLaunchRounded, InfoOutlined,
  DeleteSweepRounded, ExpandMoreRounded, ContentCopyRounded, HubRounded,
  LayersRounded, DnsRounded, StorageRounded,
  VisibilityRounded
} from "@mui/icons-material";
import api from "../api/axios";
import { useChat } from "./Layout";
import { useTypewriter } from "../hooks/userTypeWriter";

import "../styling/Intentchat.css";
import "../styling/PlanInspector.css";

const IntentChat: React.FC = () => {
  const { messages, setMessages, pendingPlan, setPendingPlan, clearChat } = useChat();
  const [intent, setIntent] = useState("");
  const [submittedIntent, setSubmittedIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isPlanCollapsed, setIsPlanCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [planningStep, setPlanningStep] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getPlanningMessages = useCallback((intent: string) => {
    const lower = intent.toLowerCase();
    if (lower.startsWith("remove") || lower.startsWith("delete")) {
      return [
        "Identifying the resource to remove...",
        "Checking if resource exists in the cluster...",
        "Preparing deletion plan...",
        "Verifying dependent resources...",
        "Finalizing removal strategy...",
      ];
    }
    if (lower.startsWith("scale")) {
      return [
        "Analyzing current replica count...",
        "Checking cluster capacity...",
        "Calculating optimal replica distribution...",
        "Preparing scaling plan...",
        "Finalizing resource adjustments...",
      ];
    }
    return [
      "Analyzing your intent...",
      "Scanning available images...",
      "Calculating resource requirements...",
      "Generating Kubernetes manifests...",
      "Optimizing for cluster capacity...",
    ];
  }, []);

  const planningMessages = useMemo(() => getPlanningMessages(submittedIntent), [submittedIntent, getPlanningMessages]);

  useEffect(() => {
    if (!loading) { setPlanningStep(0); return; }
    const interval = setInterval(() => {
      setPlanningStep((p) => (p + 1) % planningMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, planningMessages.length]);

  const placeholderText = useTypewriter([
    "Deploy nginx with 5 replicas.",
    "Remove nginx from default namespace.",
    "Scale redis to 3 replicas.",
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Cleanup: Limit messages history to 50 to prevent memory bloat
  useEffect(() => {
    if (messages.length > 50) {
      setMessages((p: any) => p.slice(-50));
    }
  }, [messages.length]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generatePlan = async () => {
    if (!intent.trim() || loading) return;
    const currentIntent = intent;
    setMessages((p: any) => [...p, { role: "user", text: currentIntent }]);
    setSubmittedIntent(currentIntent);
    setIntent("");
    setLoading(true);
    setIsPlanCollapsed(true);
    setPendingPlan(null);

    try {
      const { data } = await api.post("/api/v1/intent/process-intent", {
        user_input: currentIntent,
        dry_run: true,
      });
      
      // Only store essential data in pendingPlan, not large manifests
      const optimizedPlan = {
        intent_received: data.intent_received,
        status: data.status,
        orchestration_plan: data.orchestration_plan,
        execution: {
          manifests: data.execution?.manifests || {},
          results: data.execution?.results || []
        },
        capacity_warnings: data.capacity_warnings || []
      };
      
      setPendingPlan(optimizedPlan);

      // Check for image validation failure
      if (data.status === "image_validation_failed") {
        const errorsList = data.image_errors?.map((e: any) => `• ${e.message}`).join("\n") || "";
        const suggestionsList = data.suggestions?.map((s: string) => `• ${s}`).join("\n") || "";
        const fullMessage = `${data.message}\n\n❌ Image Errors:\n${errorsList}\n\n💡 Suggestions:\n${suggestionsList}`;
        setMessages((p: any) => [...p, { role: "ai", text: fullMessage, isImageError: true }]);
      } else if (data.status === "ambiguous_intent") {
        const suggestionsList = data.suggestions?.map((s: string) => `• ${s}`).join("\n") || "";
        const examplesList = data.example_intents?.map((e: string) => `• ${e}`).join("\n") || "";
        
        const fullMessage = `${data.message}\n\n📋 Suggestions:\n${suggestionsList}\n\n💡 Examples:\n${examplesList}`;
        setMessages((p: any) => [...p, { role: "ai", text: fullMessage, isAmbiguous: true }]);
      } else {
        const manifests = data.execution?.manifests || {};
        const hasResources = Object.keys(manifests).length > 0;
        const plans = data.orchestration_plan?.plans || [];
        const allNoAction = plans.length > 0 && plans.every((p: any) => p.action === "no_action");

        if (hasResources) {
          setIsPlanCollapsed(false);
          setMessages((p: any) => [...p, { role: "ai", text: "I've prepared your deployment plan! Review the details in the panel on the right, then apply when ready.", isActionable: true }]);
        } else if (allNoAction) {
          const names = plans.map((p: any) => p.app_name).join(", ");
          setMessages((p: any) => [...p, { role: "ai", text: `${names} already exist(s) — no changes needed.` }]);
        } else {
          setMessages((p: any) => [...p, { role: "ai", text: "Requested resource(s) do not exist." }]);
        }
      }
    } catch {
      setMessages((p: any) => [...p, { role: "ai", text: "Something went wrong while creating your plan. Please check your backend connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate context-aware success message
  const getSuccessMessage = (plans: any[]): string => {
    if (!plans || plans.length === 0) {
      return "Operation completed successfully!";
    }

    const actions = plans.map(p => p.action);
    const hasCreate = actions.some(a => a === 'create' || a === 'create_namespace');
    const hasUpdate = actions.includes('update');
    const hasDelete = actions.some(a => a === 'delete' || a === 'delete_namespace');

    // Count different action types for more specific messaging
    const createCount = actions.filter(a => a === 'create' || a === 'create_namespace').length;
    const updateCount = actions.filter(a => a === 'update').length;
    const deleteCount = actions.filter(a => a === 'delete' || a === 'delete_namespace').length;

    // Single action - specific message
    if (actions.length === 1) {
      const action = actions[0];
      if (action === 'create' || action === 'create_namespace') {
        return "Infrastructure deployed successfully! Your resources are now running in the cluster.";
      }
      if (action === 'update') {
        return "Infrastructure updated successfully!";
      }
      if (action === 'delete' || action === 'delete_namespace') {
        return "Resources deleted successfully!";
      }
    }

    // Multiple actions - summarize
    const parts: string[] = [];
    if (hasCreate) parts.push(`${createCount} created`);
    if (hasUpdate) parts.push(`${updateCount} updated`);
    if (hasDelete) parts.push(`${deleteCount} deleted`);

    if (parts.length > 0) {
      return `Operation completed! ${parts.join(', ')}.`;
    }

    return "Operation completed successfully!";
  };

  const applyInfrastructure = async () => {
    if (!pendingPlan || applying) return;
    setApplying(true);
    
    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const { data: responseData } = await api.post("/api/v1/intent/process-intent", {
        user_input: pendingPlan.intent_received,
        dry_run: false,
      }, {
        signal: abortController.signal
      } as any);

      // Generate context-aware success message based on the orchestration plan
      const plans = responseData?.orchestration_plan?.plans || [];
      const results = responseData?.execution?.results || [];
      const hasCapacityWarnings = responseData?.capacity_warnings?.length > 0;
      const successMessage = getSuccessMessage(plans);

      // Build detailed deployment info as a clean list
      let detailedMessage = successMessage + "\n\n📦 Deployment Details:\n";
      
      // Show capacity warnings if any
      if (hasCapacityWarnings) {
        detailedMessage += "\n⚠️ Capacity Warnings:\n";
        responseData.capacity_warnings.forEach((w: string) => {
          detailedMessage += `   • ${w}\n`;
        });
      }
      
      plans.forEach((plan: any, idx: number) => {
        // Get corresponding result for capacity info
        const result = results[idx];
        const capacity = result?.capacity;
        const replicasInfo = capacity?.replicas;
        const isAdjusted = replicasInfo?.adjusted;
        const deployedReplicas = isAdjusted ? replicasInfo.deployed : null;

        if (plan.action === "delete" || plan.action === "delete_namespace") {
          const namespace = plan.target_namespace || "default";
          const appName = plan.app_name.toUpperCase();
          detailedMessage += `\n${idx + 1}. ❌ ${appName}\n`;
          detailedMessage += `   Namespace: ${namespace}\n`;
        } else if (plan.action === "create" || plan.action === "update") {
          const namespace = plan.target_namespace || "default";
          const replicas = plan.replicas || 1;
          const image = plan.image || "N/A";
          
          if (plan.action === "create_namespace") {
            detailedMessage += `\n${idx + 1}. ✅ Namespace: ${namespace}\n`;
          } else if (plan.image) {
            // Workload deployment
            const appName = plan.app_name.toUpperCase();
            const status = plan.action === "create" ? "Created" : "Updated";
            const kindLabel = plan.resource_kind === 'statefulset' ? ' [STATEFULSET]' : '';
            detailedMessage += `\n${idx + 1}. ✅ ${appName}${kindLabel} [${status}]\n`;
            detailedMessage += `   Image: ${image}\n`;
            if (isAdjusted && deployedReplicas !== null) {
              detailedMessage += `   Replicas: ${deployedReplicas} (requested ${replicasInfo.requested}, max possible ${replicasInfo.max_possible}) ⚠️\n`;
              detailedMessage += `   Reason: ${replicasInfo.reason}\n`;
            } else {
              detailedMessage += `   Replicas: ${replicas}\n`;
            }
            detailedMessage += `   Namespace: ${namespace}\n`;
            
            if (plan.container_port) {
              detailedMessage += `   Port: ${plan.container_port}\n`;
            }
            if (plan.storage_gb) {
              detailedMessage += `   Storage: ${plan.storage_gb}GB\n`;
            }
            if (plan.autoscaling) {
              const hpaCap = capacity?.hpa_capped;
              const displayMax = hpaCap?.max_replicas?.to ?? plan.autoscaling.max_replicas;
              const displayMin = hpaCap?.min_replicas?.to ?? plan.autoscaling.min_replicas;
              detailedMessage += `   Auto-scale: min ${displayMin} - max ${displayMax} at ${plan.autoscaling.cpu_threshold_percent}% CPU\n`;
              if (hpaCap?.max_replicas) {
                detailedMessage += `   ⚠️ HPA max capped from ${hpaCap.max_replicas.from} to ${hpaCap.max_replicas.to} (cluster capacity limit)\n`;
              }
              if (hpaCap?.min_replicas) {
                detailedMessage += `   ⚠️ HPA min capped from ${hpaCap.min_replicas.from} to ${hpaCap.min_replicas.to} (cluster capacity limit)\n`;
              }
            }
            // Display database credentials (stored in secret_data for database images)
            if (plan.secret_data) {
              const dbKeys = Object.keys(plan.secret_data).filter((key: string) => 
                key.includes('PASSWORD') || key.includes('USER') || key.includes('DATABASE')
              );
              if (dbKeys.length > 0) {
                detailedMessage += `   🔐 Credentials (base64):\n`;
                dbKeys.forEach((key: string) => {
                  const value = plan.secret_data[key];
                  const encoded = btoa(String(value));
                  detailedMessage += `      ${key}: ${encoded}\n`;
                });
              }
            }
          } else {
            // Infrastructure resource
            const resourceName = plan.app_name.toUpperCase();
            detailedMessage += `\n${idx + 1}. ✅ ${resourceName}\n`;
            detailedMessage += `   Namespace: ${namespace}\n`;
          }
        }
      });

      setMessages((p: any) => [...p, { role: "ai", text: detailedMessage }]);
      setPendingPlan(null); // Clear pendingPlan to free memory
      setIsPlanCollapsed(true);
    } catch (error: any) {
      // Check if error is due to cancellation
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        setMessages((p: any) => [...p, { role: "ai", text: "⏹️ Deployment cancelled by user." }]);
      } else {
        console.error("Apply infrastructure error:", error);
        setMessages((p: any) => [...p, { role: "ai", text: "Operation failed. Please check your Kubernetes cluster permissions and resources, then retry." }]);
      }
      setPendingPlan(null); // Clear even on error
    } finally {
      setApplying(false);
      abortControllerRef.current = null;
    }
  };

  const cancelDeployment = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setApplying(false);
      setMessages((p: any) => [...p, { role: "ai", text: "⏹️ Deployment cancellation requested. Please wait for confirmation..." }]);
    }
  };

  const getResourceKindLabel = (key: string) => {
    // Splits "prod-Deployment" -> "Deployment"
    const kind = key.includes("-") ? key.split("-")[1] : key;
    if (kind === "HorizontalPodAutoscaler") return "HPA";
    if (kind === "HeadlessService") return "Headless Service";
    return kind;
  };

  const manifestsData = pendingPlan?.execution?.manifests;
  
  const groupedManifests = useMemo(() => {
    if (!manifestsData || Array.isArray(manifestsData)) return {};

    // Grouping logic for the dictionary: store both key and yaml
    return Object.entries(manifestsData).reduce((acc: any, [key, yaml]) => {
      const kind = getResourceKindLabel(key);
      if (!acc[kind]) acc[kind] = [];
      acc[kind].push({ key, yaml });
      return acc;
    }, {});
  }, [manifestsData]);

  // Determine which manifests are for delete operations
  const deleteManifestKeys = useMemo(() => {
    const keys = new Set<string>();
    const plans = pendingPlan?.orchestration_plan?.plans || [];

    plans.forEach((plan: any) => {
      const action = plan.action;
      if (action === 'delete' || action === 'delete_namespace') {
        const namespace = plan.target_namespace || 'default';

        if (action === 'delete_namespace') {
          keys.add(`${namespace}-Namespace`);
        } else {
          // For delete actions, ALL associated resources should be marked as delete
          // regardless of whether the AI included optional fields in the plan
          keys.add(`${namespace}-Deployment`);
          keys.add(`${namespace}-Service`);
          keys.add(`${namespace}-Ingress`);
          keys.add(`${namespace}-HorizontalPodAutoscaler`);
          keys.add(`${namespace}-ConfigMap`);
          keys.add(`${namespace}-PersistentVolumeClaim`);
          keys.add(`${namespace}-StatefulSet`);
          keys.add(`${namespace}-HeadlessService`);
        }
      }
    });

    return keys;
  }, [pendingPlan]);

  // Helper to get expected manifest keys for a plan's delete action
  const getExpectedKeysForPlan = (plan: any, namespace: string): Set<string> => {
    const keys = new Set<string>();
    const action = plan.action;
    if (action === 'delete' || action === 'delete_namespace') {
      if (action === 'delete_namespace') {
        keys.add(`${namespace}-Namespace`);
      } else {
        // For delete actions, consider ALL possible resources that might exist
        keys.add(`${namespace}-Deployment`);
        keys.add(`${namespace}-Service`);
        keys.add(`${namespace}-Ingress`);
        keys.add(`${namespace}-HorizontalPodAutoscaler`);
        keys.add(`${namespace}-ConfigMap`);
        keys.add(`${namespace}-PersistentVolumeClaim`);
        keys.add(`${namespace}-StatefulSet`);
        keys.add(`${namespace}-HeadlessService`);
      }
    }
    return keys;
  };

  const actualManifestKeys = useMemo(() => {
    const manifests = pendingPlan?.execution?.manifests || {};
    return new Set(Object.keys(manifests));
  }, [pendingPlan]);

  const hasResources = useMemo(() => {
    return actualManifestKeys.size > 0;
  }, [actualManifestKeys]);

  // Determine if there are actual delete manifests to show warning banner
  const hasActualDelete = useMemo(() => {
    const actualKeys = Object.keys(pendingPlan?.execution?.manifests || {});
    return actualKeys.some(key => deleteManifestKeys.has(key));
  }, [pendingPlan]);

  return (
    <Box className="main-content-wrapper" sx={{ width: "100%", height: "100%", minHeight: "100%", display: "flex", flexDirection: "row", background: "var(--bg-app)" }}>
      {/* LEFT: CHAT */}
      <Box className="chat-main-section" sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box className="chat-header">
          <Button onClick={clearChat} startIcon={<DeleteSweepRounded sx={{ fontSize: 16 }} />} sx={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Clear Session
          </Button>
        </Box>

        <div className="message-list" ref={scrollRef}>
          {messages.map((m: any, i: number) => (
            <Fade in={true} key={i}>
              <div className={`message-bubble ${m.role === "user" ? "user-message" : "ai-message"}`}>
                {m.isAmbiguous ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {m.text.split('\n')[0]}
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'var(--bg-secondary)', 
                      p: 1.5, 
                      borderRadius: '8px', 
                      borderLeft: '3px solid var(--accent)',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-secondary)'
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}>
                        {m.text.substring(m.text.indexOf('\n\n'))}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
                    {m.text}
                  </Typography>
                )}
                {m.isActionable && pendingPlan && i === messages.length - 1 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid var(--border)', display: 'flex', gap: 1 }}>
                    {!applying ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={applyInfrastructure}
                          disabled={applying}
                          startIcon={applying ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <RocketLaunchRounded sx={{ fontSize: 16 }} />}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                            bgcolor: 'var(--accent)',
                            color: 'white !important',
                            '&:hover': { bgcolor: 'var(--accent)', opacity: 0.9 },
                            '&.Mui-disabled': { bgcolor: 'var(--accent)', opacity: 0.6 }
                          }}
                        >
                          {applying ? "Applying..." : "Apply Now"}
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => setIsPlanCollapsed(false)} sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem', py: 0.5, color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                          Inspect Details
                        </Button>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <CircularProgress size={16} sx={{ color: 'var(--accent)' }} />
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Deployment in progress...
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={cancelDeployment}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                            color: '#ef4444',
                            borderColor: '#ef4444',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </div>
            </Fade>
          ))}
          {loading && (
            <div className="message-bubble ai-message">
              <span className="planning-text" key={planningStep}>
                {planningMessages[planningStep]}
              </span>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <div className="input-container">
            <input className="intent-input" placeholder={placeholderText} value={intent} onChange={(e) => setIntent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generatePlan()} disabled={loading || applying} />
            <IconButton onClick={generatePlan} disabled={loading || !intent.trim()}>
              <SendRounded sx={{ color: loading ? 'var(--text-secondary)' : 'var(--accent)' }} />
            </IconButton>
          </div>
        </div>
      </Box>

      {/* RIGHT: PLAN INSPECTOR */}
      <Box className={`plan-inspector ${isPlanCollapsed ? "collapsed" : ""}`}>
        <div className="plan-header">
          <Box className="plan-header-title">
            <Box sx={{ p: 1, borderRadius: "8px", background: "rgba(var(--accent-rgb), 0.08)" }}>
              <AutoAwesomeRounded sx={{ color: "var(--accent)", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography className="title-main">Plan Inspector</Typography>
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>Dry Run Preview</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setIsPlanCollapsed(true)} size="small" sx={{ color: 'var(--text-primary)' }}><ChevronRightRounded /></IconButton>
        </div>

        {pendingPlan && !loading && (
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'var(--border)' }}>
            <Tab icon={<AccountTreeRounded fontSize="small" />} label="Resources" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
            <Tab icon={<CodeRounded fontSize="small" />} label="YAML" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
          </Tabs>
        )}

        <div className="plan-content">
          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '12px', m: 2 }} />
          ) : pendingPlan && pendingPlan.status === "ambiguous_intent" ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <InfoOutlined sx={{ fontSize: 40, color: 'var(--accent)', mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No plan to display. Please provide a more specific intent.
              </Typography>
            </Box>
          ) : pendingPlan ? (
            activeTab === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="plan-card">
                  <span className="plan-label">Summary</span>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {pendingPlan.orchestration_plan?.overall_summary || "Orchestration plan generated."}
                  </Typography>
                </div>

                {/* Cluster capacity summary from first result */}
                {(() => {
                  const firstResult = (pendingPlan?.execution?.results || []).find((r: any) => r?.capacity?.cluster_capacity);
                  const cc = firstResult?.capacity?.cluster_capacity;
                  const ac = firstResult?.capacity?.available_capacity;
                  if (!cc) return null;
                  return (
                    <div className="plan-card" style={{ background: 'rgba(var(--accent-rgb), 0.04)' }}>
                      <span className="plan-label">Cluster Capacity</span>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                        <Box>
                          <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Total CPU</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(cc.total_cpu_milli / 1000).toFixed(1)} cores</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Used CPU</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(cc.used_cpu_milli / 1000).toFixed(1)} cores</Typography>
                        </Box>
                        {ac && (
                          <Box>
                            <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Available CPU</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>{(ac.cpu_milli / 1000).toFixed(1)} cores</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Total Memory</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(cc.total_mem_mib / 1024).toFixed(1)} Gi</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Used Memory</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(cc.used_mem_mib / 1024).toFixed(1)} Gi</Typography>
                        </Box>
                        {ac && (
                          <Box>
                            <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Available Memory</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>{(ac.memory_mib / 1024).toFixed(1)} Gi</Typography>
                          </Box>
                        )}
                      </Box>
                    </div>
                  );
                })()}

                {/* Capacity warnings */}
                {pendingPlan.capacity_warnings && pendingPlan.capacity_warnings.length > 0 && (
                  <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.75rem', mb: 0.5 }}>
                      ⚠️ Capacity Warnings
                    </Typography>
                    {pendingPlan.capacity_warnings.map((w: string, i: number) => (
                      <Typography key={i} variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                        {w}
                      </Typography>
                    ))}
                  </Box>
                )}
                
                <div className="plan-card">
                  <span className="plan-label">Planned Infrastructure Details</span>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    {(() => {
                      const allPlans = pendingPlan?.orchestration_plan?.plans || [];
                      const allResults = pendingPlan?.execution?.results || [];
                      const paired = allPlans
                        .map((p: any, i: number) => ({ plan: p, result: allResults[i] }))
                        .filter(({ plan: p }: any) => {
                          const ns = p.target_namespace || 'default';
                          if (p.action === 'delete' || p.action === 'delete_namespace') {
                            const expected = getExpectedKeysForPlan(p, ns);
                            for (const k of expected) { if (actualManifestKeys.has(k)) return true; }
                            return false;
                          }
                          return true;
                        });
                      if (paired.length === 0) {
                        return <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No resources to display.</Typography>;
                      }
                      return paired.map(({ plan: item, result }: any, i: number) => {
                        const capacity = result?.capacity;
                        const replicasInfo = capacity?.replicas;
                        const isAdjusted = replicasInfo?.adjusted;
                        const hasCapacityInfo = replicasInfo && replicasInfo.requested > 0;
                        return (
                        <Box key={i} className="resource-item" sx={{ borderLeft: '2px solid var(--accent)', pl: 2, py: 0.5 }}>
                          <Typography sx={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {item.action.replace('_', ' ')}: {item.app_name}
                            {item.resource_kind === 'statefulset' && (
                              <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '0.65rem', marginLeft: 8, border: '1px solid #8b5cf6', borderRadius: 4, padding: '1px 6px' }}>
                                STATEFULSET
                              </span>
                            )}
                          </Typography>
                          <Box sx={{ pl: 0.5, mt: 0.5 }}>
                            <Typography variant="caption" display="block"><b>Namespace:</b> {item.target_namespace}</Typography>
                            {item.image && <Typography variant="caption" display="block"><b>Image:</b> {item.image}</Typography>}
                            {capacity?.feasible === false ? null : item.replicas > 0 && (
                              <Typography variant="caption" display="block">
                                <b>Replicas:</b> {item.replicas}{item.autoscaling ? ' (initial)' : ''}
                                {item.autoscaling && (
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {' '}| Auto-scale: min {item.autoscaling.min_replicas} - max {item.autoscaling.max_replicas} at {item.autoscaling.cpu_threshold_percent}% CPU
                                  </span>
                                )}
                                {hasCapacityInfo && isAdjusted && (
                                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                    {' '}→ Deployed: {replicasInfo.deployed} (adjusted ⚠️)
                                  </span>
                                )}
                                {hasCapacityInfo && !isAdjusted && (
                                  <span style={{ color: '#22c55e' }}>
                                    {' '}✓ {replicasInfo.deployed} possible
                                  </span>
                                )}
                              </Typography>
                            )}
                            {hasCapacityInfo && isAdjusted && capacity?.feasible !== false && (
                              <>
                                <Typography variant="caption" display="block" sx={{ color: '#f59e0b', mt: 0.5 }}>
                                  <b>📊 Capacity:</b> Requested {replicasInfo.requested}, max possible {replicasInfo.max_possible}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                                  {replicasInfo.reason}
                                </Typography>
                              </>
                            )}
                            {item.autoscaling && hasCapacityInfo && (
                              <>
                                {capacity?.hpa_capped?.max_replicas && (
                                  <Typography variant="caption" display="block" sx={{ color: '#f59e0b', mt: 0.5 }}>
                                    <b>⚠️ HPA max capped:</b> Cluster can only fit {replicasInfo.max_possible} pods — HPA max reduced from {capacity.hpa_capped.max_replicas.from} to {capacity.hpa_capped.max_replicas.to}
                                  </Typography>
                                )}
                                {capacity?.hpa_capped?.min_replicas && (
                                  <Typography variant="caption" display="block" sx={{ color: '#f59e0b', mt: 0.5 }}>
                                    <b>⚠️ HPA min capped:</b> Min replicas reduced from {capacity.hpa_capped.min_replicas.from} to {capacity.hpa_capped.min_replicas.to} (capacity limit)
                                  </Typography>
                                )}
                              </>
                            )}
                            {capacity?.available_capacity && (
                              <Typography variant="caption" display="block" sx={{ color: 'var(--text-secondary)', fontSize: '0.65rem', mt: 0.25 }}>
                                Cluster available: {capacity.available_capacity.cpu_milli}m CPU, {capacity.available_capacity.memory_mib}Mi RAM
                              </Typography>
                            )}
                            {capacity?.feasible === false && (
                              <Typography variant="caption" display="block" sx={{ color: '#ef4444', fontWeight: 700, mt: 1, fontSize: '0.75rem', border: '1px solid #ef4444', borderRadius: 1, px: 1, py: 0.5, display: 'inline-block' }}>
                                ✕ CANNOT DEPLOY — Insufficient cluster capacity
                              </Typography>
                            )}
                            {capacity?.feasible === true && (
                              <Typography variant="caption" display="block" sx={{ color: '#22c55e', fontWeight: 700, mt: 1, fontSize: '0.75rem', border: '1px solid #22c55e', borderRadius: 1, px: 1, py: 0.5, display: 'inline-block' }}>
                                ✓ CAN DEPLOY
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'var(--text-secondary)', mt: 0.5, display: 'block' }}>
                              "{item.reasoning}"
                            </Typography>
                          </Box>
                        </Box>
                      );});
                    })()}
                  </Box>
                </div>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Warning banner for delete operations (only if actual resources will be deleted) */}
                {hasResources && hasActualDelete && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: 2,
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <DeleteSweepRounded sx={{ color: '#ef4444', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>
                      Warning: The following resources will be permanently deleted. Please review carefully before applying.
                    </Typography>
                  </Box>
                )}
                {Object.keys(groupedManifests || {}).map((kind) => {
                  const items = groupedManifests[kind];
                  // Check if any manifest of this kind is part of a delete operation
                  const hasDelete = items.some((item: any) => deleteManifestKeys.has(item.key));
                  return (
                    <Accordion key={kind} className="yaml-accordion" elevation={0}>
                      <AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: 'var(--text-secondary)' }} />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <LayersRounded sx={{ fontSize: 16, color: 'var(--accent)' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {kind}s ({items.length})
                          </Typography>
                          {hasDelete && (
                            <Chip
                              size="small"
                              label="DELETE"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: '#ef4444',
                                color: 'white',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {items.map((item: any, yIdx: number) => (
                          <Box key={yIdx} sx={{ position: 'relative', borderTop: '1px solid var(--border)' }}>
                            <Tooltip title="Copy YAML">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(item.yaml)}
                                sx={{ position: 'absolute', right: 10, top: 10, zIndex: 10, color: 'var(--accent)' }}
                              >
                                <ContentCopyRounded fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <pre className="yaml-pre" style={{ margin: 0, padding: '15px', fontSize: '0.7rem' }}>{item.yaml}</pre>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )
          ) : (
            <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.2 }}>
              <VisibilityRounded sx={{ fontSize: 60, color: 'var(--text-primary)' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Awaiting Intent...</Typography>
            </Box>
          )}
        </div>

        {pendingPlan && !loading && hasResources && (
          <>
            {applying && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <LinearProgress sx={{ height: 3, bgcolor: 'rgba(var(--accent-rgb), 0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'var(--accent)' } }} />
              </Box>
            )}
            <div className="plan-footer">
              <Button
                variant="contained"
                className="btn-commit"
                fullWidth
                onClick={applyInfrastructure}
                disabled={applying}
                startIcon={applying ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <RocketLaunchRounded />}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  bgcolor: 'var(--accent)',
                  color: 'white !important',
                  '&:hover': {
                    bgcolor: 'var(--accent)',
                    opacity: 0.9
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'var(--accent)',
                    opacity: 0.7
                  }
                }}
              >
                {applying ? "Executing..." : "Apply Infrastructure"}
              </Button>
            </div>
          </>
        )}
      </Box>

      {isPlanCollapsed && (
        <Box className="expand-handle" onClick={() => setIsPlanCollapsed(false)}>
          <ChevronLeftRounded sx={{ color: "var(--accent)" }} />
        </Box>
      )}
    </Box>
  );
};

export default IntentChat;