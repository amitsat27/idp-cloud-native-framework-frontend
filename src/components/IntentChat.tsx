import React, { useState, useRef, useEffect, useMemo } from "react";
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
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isPlanCollapsed, setIsPlanCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0); 
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generatePlan = async () => {
    if (!intent.trim() || loading) return;
    const currentIntent = intent;
    setMessages((p: any) => [...p, { role: "user", text: currentIntent }]);
    setIntent("");
    setLoading(true);
    setIsPlanCollapsed(true); // Keep closed during generation
    setPendingPlan(null);

    try {
      const { data } = await api.post("/api/v1/intent/process-intent", {
        user_input: currentIntent,
        dry_run: true,
      });
      setPendingPlan(data);

      // Check if plan has any actual resources to act upon
      const manifests = data.execution?.manifests || {};
      const hasResources = Object.keys(manifests).length > 0;

      if (hasResources) {
        // Valid plan with resources - open inspector and show actionable message
        setIsPlanCollapsed(false);
        setMessages((p: any) => [...p, { role: "ai", text: "I've prepared your deployment plan! Review the details in the panel on the right, then apply when ready.", isActionable: true }]);
      } else {
        // No resources found - simple message
        setMessages((p: any) => [...p, { role: "ai", text: "Requested resource(s) do not exist." }]);
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
    try {
      await api.post("/api/v1/intent/process-intent", {
        user_input: pendingPlan.intent_received,
        dry_run: false,
      });

      // Generate context-aware success message based on the orchestration plan
      const plans = pendingPlan?.orchestration_plan?.plans || [];
      const successMessage = getSuccessMessage(plans);

      setMessages((p: any) => [...p, { role: "ai", text: successMessage }]);
      setPendingPlan(null);
      setIsPlanCollapsed(true);
    } catch (error: any) {
      console.error("Apply infrastructure error:", error);
      setMessages((p: any) => [...p, { role: "ai", text: "Operation failed. Please check your Kubernetes cluster permissions and resources, then retry." }]);
    } finally {
      setApplying(false);
    }
  };

  const getResourceKindLabel = (key: string) => {
    // Splits "prod-Deployment" -> "Deployment"
    const kind = key.includes("-") ? key.split("-")[1] : key;
    if (kind === "HorizontalPodAutoscaler") return "HPA";
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

  // Filter plans to only show those that have at least one actual manifest (for deletes) or all non-deletes
  const filteredPlans = useMemo(() => {
    const plans = pendingPlan?.orchestration_plan?.plans || [];
    return plans.filter((item: any) => {
      const namespace = item.target_namespace || 'default';
      if (item.action === 'delete' || item.action === 'delete_namespace') {
        const expectedKeys = getExpectedKeysForPlan(item, namespace);
        // Show if any expected key exists in actual manifests
        for (const key of expectedKeys) {
          if (actualManifestKeys.has(key)) {
            return true;
          }
        }
        return false;
      }
      return true; // show non-delete always
    });
  }, [pendingPlan, actualManifestKeys]);

  // Determine if there are actual delete manifests to show warning banner
  const hasActualDelete = useMemo(() => {
    const actualKeys = Object.keys(pendingPlan?.execution?.manifests || {});
    return actualKeys.some(key => deleteManifestKeys.has(key));
  }, [pendingPlan]);

  return (
    <Box className="main-content-wrapper" sx={{ width: "100%", height: "100%", display: "flex", background: "var(--bg-app)" }}>
      {/* LEFT: CHAT */}
      <Box className="chat-main-section" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box className="chat-header">
          <Button onClick={clearChat} startIcon={<DeleteSweepRounded sx={{ fontSize: 16 }} />} sx={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Clear Session
          </Button>
        </Box>

        <div className="message-list" ref={scrollRef}>
          {messages.map((m: any, i: number) => (
            <Fade in={true} key={i}>
              <div className={`message-bubble ${m.role === "user" ? "user-message" : "ai-message"}`}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{m.text}</Typography>
                {m.isActionable && pendingPlan && i === messages.length - 1 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid var(--border)', display: 'flex', gap: 1 }}>
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
                  </Box>
                )}
              </div>
            </Fade>
          ))}
          {loading && (
            <div className="message-bubble ai-message">
              <div className="typing-indicator"><span></span><span></span><span></span></div>
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
          ) : pendingPlan ? (
            activeTab === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="plan-card">
                  <span className="plan-label">Summary</span>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {pendingPlan.orchestration_plan?.overall_summary || "Orchestration plan generated."}
                  </Typography>
                </div>
                
                <div className="plan-card">
                  <span className="plan-label">Planned Infrastructure Details</span>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                    {filteredPlans.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No resources to display.
                      </Typography>
                    ) : (
                      filteredPlans.map((item: any, idx: number) => (
                        <Box key={idx} className="resource-item" sx={{ borderLeft: '2px solid var(--accent)', pl: 2, py: 0.5 }}>
                          <Typography sx={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            {item.action.replace('_', ' ')}: {item.app_name}
                          </Typography>
                          <Box sx={{ pl: 0.5, mt: 0.5 }}>
                            <Typography variant="caption" display="block"><b>Namespace:</b> {item.target_namespace}</Typography>
                            {item.image && <Typography variant="caption" display="block"><b>Image:</b> {item.image}</Typography>}
                            {item.replicas > 0 && <Typography variant="caption" display="block"><b>Replicas:</b> {item.replicas}</Typography>}
                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'var(--text-secondary)', mt: 0.5, display: 'block' }}>
                              "{item.reasoning}"
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
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