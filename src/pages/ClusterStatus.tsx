import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  DnsRounded, 
  LayersRounded, 
  HubRounded, 
  AutorenewRounded,
  SpeedRounded,
  MemoryRounded
} from "@mui/icons-material";
import { Box, Typography, Chip, Skeleton, Divider, LinearProgress, Tooltip, IconButton } from "@mui/material";

import "../styling/PlanInspector.css"; 

const ClusterStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [clusterData, setClusterData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const healthRes = await api.get('/health');
      setIsOnline(healthRes.data.status === 'online');

      const stateRes = await api.get('/api/v1/cluster/state');
      if (stateRes.data.status === 'success') {
        setClusterData(stateRes.data.data);
      }
    } catch (error) {
      console.error("Failed to sync cluster data", error);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); 
    return () => clearInterval(interval);
  }, []);

  const getStatusColors = () => {
    if (isOnline === null) return { text: 'var(--text-secondary)', bg: 'rgba(148, 163, 184, 0.1)', border: 'var(--border)' };
    if (isOnline) return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' };
    return { text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e' };
  };

  const colors = getStatusColors();

  return (
    <div style={{ width: '100%', padding: '40px', boxSizing: 'border-box', background: 'var(--bg-app)', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ borderRadius: "8px", background: "rgba(var(--accent-rgb), 0.08)", display: 'flex', padding: '10px' }}>
            <HubRounded sx={{ color: "var(--accent)", fontSize: 24 }} />
          </div>
          <div>
            <Typography sx={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Cluster Overview</Typography>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>Real-time Kubernetes Inventory</Typography>
          </div>
        </Box>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: '6px', backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.text }}></span>
          {isOnline === null ? 'Syncing' : isOnline ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* CORE METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* CPU USAGE CARD */}
        <div className="plan-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SpeedRounded sx={{ color: 'var(--accent)', fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CPU Usage</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            {loading ? <Skeleton width="100px" /> : `${clusterData?.global_metrics?.cpu_used_m}m / ${clusterData?.global_metrics?.cpu_cap_m}m`}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>Pressure</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>{clusterData?.global_metrics?.cpu_percent}%</Typography>
            </div>
            <LinearProgress variant="determinate" value={clusterData?.global_metrics?.cpu_percent || 0} sx={{ height: 4, borderRadius: 2, bgcolor: 'var(--border)', '& .MuiLinearProgress-bar': { bgcolor: 'var(--accent)' } }} />
          </Box>
        </div>

        {/* MEMORY USAGE CARD */}
        <div className="plan-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MemoryRounded sx={{ color: '#a855f7', fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>RAM Usage</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            {loading ? <Skeleton width="100px" /> : `${clusterData?.global_metrics?.mem_used_mi}Mi / ${clusterData?.global_metrics?.mem_cap_mi}Mi`}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>Pressure</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>{clusterData?.global_metrics?.mem_percent}%</Typography>
            </div>
            <LinearProgress variant="determinate" value={clusterData?.global_metrics?.mem_percent || 0} sx={{ height: 4, borderRadius: 2, bgcolor: 'var(--border)', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />
          </Box>
        </div>
        
        {/* ACTIVE NAMESPACES */}
        <div className="plan-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', mb: 2 }}>Namespaces</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {loading ? <Skeleton width="100%" height="24px" /> : clusterData?.active_namespaces?.map((ns: string) => (
              <Chip key={ns} label={ns} size="small" sx={{ borderRadius: '4px', bgcolor: 'transparent', color: 'var(--text-primary)', fontWeight: 600, border: '1px solid var(--border)', fontSize: '0.75rem' }} />
            ))}
          </Box>
        </div>
      </div>

      <Divider sx={{ mb: 4, borderColor: 'var(--border)' }} />

      {/* WORKLOADS SECTION */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LayersRounded sx={{ color: 'var(--accent)', fontSize: 20 }} />
        <Typography sx={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Workload Inventory</Typography>
      </Box>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={140} sx={{ borderRadius: '12px' }} />)
        ) : clusterData?.existing_workloads?.length > 0 ? (
          clusterData.existing_workloads.map((workload: any, idx: number) => (
            <div key={idx} className="plan-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{workload.name}</Typography>
                  <Typography sx={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.75rem' }}>{workload.namespace}</Typography>
                </Box>
                <Chip label={workload.status} size="small" variant="outlined" sx={{ borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, height: '20px', color: workload.status === 'Healthy' ? '#10b981' : '#f43f5e', borderColor: workload.status === 'Healthy' ? '#10b981' : '#f43f5e' }} />
              </Box>

              <Box sx={{ background: 'rgba(var(--text-secondary-rgb), 0.04)', p: 1.5, borderRadius: '6px', mb: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {workload.actual_usage?.cpu || '0m'} CPU Usage
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {workload.actual_usage?.memory || '0Mi'} RAM Usage
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                 <Tooltip title="Refresh State">
                   <IconButton size="small" sx={{ color: 'var(--text-secondary)' }} onClick={fetchData}>
                     <AutorenewRounded sx={{ fontSize: 18 }} />
                   </IconButton>
                 </Tooltip>
              </Box>
            </div>
          ))
        ) : (
          <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No workloads detected.</Typography>
          </Box>
        )}
      </div>
    </div>
  );
};

export default ClusterStatus;