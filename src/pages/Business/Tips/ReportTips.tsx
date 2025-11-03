import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, User, Plus, List } from 'lucide-react';
import Layout from '../../../components/Layout/Layout';
import { getEmployees } from '../../../services/employee.service';
import { deductionsService } from '../../../services/deductions.service';
import { formatErrorMessage } from '../../../services/api';
import { Employee, Incident } from '../../../types';

const ReportTips: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<'tip' | 'bonus'>('tip');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployee && showHistory) {
      loadIncidents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, showHistory]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: formatErrorMessage(error) });
    }
  };

  const loadIncidents = async () => {
    if (!selectedEmployee) return;

    try {
      const data = await deductionsService.getEmployeeIncidents(selectedEmployee);
      setIncidents(data);
    } catch (error: any) {
      console.error('Error loading incidents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !amount) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (incidentType === 'tip') {
        await deductionsService.reportTips(selectedEmployee, parseFloat(amount), date, date, description);
        setMessage({ type: 'success', text: 'Tips reported successfully!' });
      } else {
        await deductionsService.createIncident({
          employee_id: selectedEmployee,
          incident_type: 'bonus',
          incident_name: 'Bonus payment',
          amount: parseFloat(amount),
          description: description || 'Bonus payment',
          incident_date: date,
        });
        setMessage({ type: 'success', text: 'Bonus added successfully!' });
      }

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);

      // Reload incidents if showing history
      if (showHistory) {
        loadIncidents();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: formatErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployeeData = employees.find(e => e.id.toString() === selectedEmployee);

  return (
    <Layout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Tips & Bonuses</h1>
          <p className="text-gray-600 mt-1">Record tips and bonuses for payroll calculation</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn bg-gray-600 text-white hover:bg-gray-700"
        >
          <List className="w-4 h-4 mr-2" />
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Incident</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="tip"
                    checked={incidentType === 'tip'}
                    onChange={() => setIncidentType('tip')}
                    className="mr-2"
                  />
                  Tips
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bonus"
                    checked={incidentType === 'bonus'}
                    onChange={() => setIncidentType('bonus')}
                    className="mr-2"
                  />
                  Bonus
                </label>
              </div>
            </div>

            {/* Employee Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Employee *
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input"
                required
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.first_name} {emp.last_name} ({emp.position})
                  </option>
                ))}
              </select>
              {selectedEmployeeData?.has_tip_credit && (
                <p className="text-sm text-blue-600 mt-1">
                  This employee has tip credit enabled
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                placeholder="0.00"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder={incidentType === 'tip' ? 'Optional notes about tips' : 'Reason for bonus'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : `Report ${incidentType === 'tip' ? 'Tips' : 'Bonus'}`}
            </button>
          </form>
        </div>

        {/* History */}
        {showHistory && selectedEmployee && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Incident History</h2>

            {incidents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No incidents found</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        incident.incident_type === 'tips_reported' ? 'bg-green-100 text-green-800' :
                        incident.incident_type === 'bonus' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.incident_type.toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${incident.amount || '0.00'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{incident.description || '-'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(incident.incident_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default ReportTips;
