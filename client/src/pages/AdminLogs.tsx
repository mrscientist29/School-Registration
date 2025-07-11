import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Filter, FileText, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: number;
  action: string;
  userId: string;
  resource: string;
  resourceId: string;
  oldData: any;
  newData: any;
  timestamp: string;
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    userId: '',
    resource: '',
    limit: 100
  });

  // Fetch audit logs
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.resource) queryParams.append('resource', filters.resource);
      queryParams.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/audit-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      action: undefined,
      userId: '',
      resource: '',
      limit: 100
    });
  };

  const getActionBadge = (action: string, success: boolean) => {
    const actionTypes = {
      'STUDENT_CREATED': { label: 'Student Created', color: 'bg-green-100 text-green-800' },
      'STUDENT_UPDATED': { label: 'Student Updated', color: 'bg-blue-100 text-blue-800' },
      'STUDENT_DELETED': { label: 'Student Deleted', color: 'bg-red-100 text-red-800' },
      'SCHOOL_CREATED': { label: 'School Created', color: 'bg-green-100 text-green-800' },
      'SCHOOL_UPDATED': { label: 'School Updated', color: 'bg-blue-100 text-blue-800' },
      'SCHOOL_DELETED': { label: 'School Deleted', color: 'bg-red-100 text-red-800' },
      'USER_LOGIN': { label: 'User Login', color: 'bg-purple-100 text-purple-800' },
      'USER_LOGOUT': { label: 'User Logout', color: 'bg-gray-100 text-gray-800' },
      'BULK_IMPORT': { label: 'Bulk Import', color: 'bg-yellow-100 text-yellow-800' },
      'BULK_EXPORT': { label: 'Bulk Export', color: 'bg-indigo-100 text-indigo-800' },
      'API_REQUEST': { label: 'API Request', color: 'bg-cyan-100 text-cyan-800' },
      'SYSTEM_ERROR': { label: 'System Error', color: 'bg-red-100 text-red-800' },
    };

    const actionInfo = actionTypes[action] || { label: action, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge 
        className={`${actionInfo.color} ${!success ? 'opacity-60' : ''}`}
        variant="secondary"
      >
        {!success && <XCircle className="w-3 h-3 mr-1" />}
        {success && <CheckCircle className="w-3 h-3 mr-1" />}
        {actionInfo.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };

  const formatData = (data: any) => {
    if (!data) return 'N/A';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const LogDetailsModal = ({ log, onClose }: { log: AuditLog; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Audit Log Details</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Action</label>
              <div className="mt-1">{getActionBadge(log.action, log.success)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Timestamp</label>
              <p className="mt-1">{formatTimestamp(log.timestamp)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">User ID</label>
              <p className="mt-1">{log.userId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Resource</label>
              <p className="mt-1">{log.resource}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Resource ID</label>
              <p className="mt-1">{log.resourceId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">IP Address</label>
              <p className="mt-1">{log.ipAddress || 'N/A'}</p>
            </div>
          </div>
          
          {log.error && (
            <div>
              <label className="text-sm font-medium text-red-600">Error</label>
              <p className="mt-1 text-red-800 bg-red-50 p-2 rounded">{log.error}</p>
            </div>
          )}
          
          {log.oldData && (
            <div>
              <label className="text-sm font-medium text-gray-600">Old Data</label>
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {formatData(log.oldData)}
              </pre>
            </div>
          )}
          
          {log.newData && (
            <div>
              <label className="text-sm font-medium text-gray-600">New Data</label>
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {formatData(log.newData)}
              </pre>
            </div>
          )}
          
          {log.details && (
            <div>
              <label className="text-sm font-medium text-gray-600">Additional Details</label>
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {formatData(log.details)}
              </pre>
            </div>
          )}
          
          {log.userAgent && (
            <div>
              <label className="text-sm font-medium text-gray-600">User Agent</label>
              <p className="mt-1 text-xs text-gray-600">{log.userAgent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Button onClick={fetchLogs} variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="STUDENT_CREATED">Student Created</SelectItem>
                  <SelectItem value="STUDENT_UPDATED">Student Updated</SelectItem>
                  <SelectItem value="STUDENT_DELETED">Student Deleted</SelectItem>
                  <SelectItem value="SCHOOL_CREATED">School Created</SelectItem>
                  <SelectItem value="SCHOOL_UPDATED">School Updated</SelectItem>
                  <SelectItem value="SCHOOL_DELETED">School Deleted</SelectItem>
                  <SelectItem value="USER_LOGIN">User Login</SelectItem>
                  <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                  <SelectItem value="BULK_IMPORT">Bulk Import</SelectItem>
                  <SelectItem value="BULK_EXPORT">Bulk Export</SelectItem>
                  <SelectItem value="API_REQUEST">API Request</SelectItem>
                  <SelectItem value="SYSTEM_ERROR">System Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">User ID</label>
              <Input
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Resource</label>
              <Input
                value={filters.resource}
                onChange={(e) => handleFilterChange('resource', e.target.value)}
                placeholder="Enter resource"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Limit</label>
              <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters}>
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Audit Logs ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action, log.success)}
                    </TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-gray-500 text-xs">{log.resourceId}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default AdminLogs;
