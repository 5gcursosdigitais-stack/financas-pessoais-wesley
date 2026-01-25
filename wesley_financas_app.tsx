import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lock, Eye, EyeOff, Moon, Sun, TrendingUp, TrendingDown, DollarSign, Target, Download, Upload, Calendar, Plus, Settings, Copy, Shield, ArrowLeft, ArrowRight } from 'lucide-react';

const WesleyFinancas = () => {
  // Estados principais
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estados de dados
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [investments, setInvestments] = useState({
    reserva: 0,
    rendaFixa: 0,
    acoes: 0,
    cripto: 0,
    veiculos: 0
  });

  // Estado do formulário
  const [formData, setFormData] = useState({
    type: 'receita',
    date: new Date().toISOString().split('T')[0],
    value: '',
    description: '',
    category: ''
  });

  // Estado de metas
  const [goalForm, setGoalForm] = useState({
    category: '',
    limit: ''
  });

  // Categorias
  const categories = {
    receita: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
    despesa: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros']
  };

  // Carregar dados do storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const pinResult = await window.storage.get('pin');
        if (pinResult) setSavedPin(pinResult.value);

        const transResult = await window.storage.get('transactions');
        if (transResult) setTransactions(JSON.parse(transResult.value));

        const goalsResult = await window.storage.get('goals');
        if (goalsResult) setGoals(JSON.parse(goalsResult.value));

        const invResult = await window.storage.get('investments');
        if (invResult) setInvestments(JSON.parse(invResult.value));
      } catch (error) {
        console.log('Primeira inicialização');
      }
    };
    loadData();
  }, []);

  // Salvar dados
  const saveData = async () => {
    try {
      await window.storage.set('transactions', JSON.stringify(transactions));
      await window.storage.set('goals', JSON.stringify(goals));
      await window.storage.set('investments', JSON.stringify(investments));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 || goals.length > 0) {
      saveData();
    }
  }, [transactions, goals, investments]);

  // Login
  const handleLogin = async () => {
    if (!savedPin) {
      await window.storage.set('pin', pin);
      setSavedPin(pin);
      setIsLocked(false);
    } else if (pin === savedPin) {
      setIsLocked(false);
    } else {
      alert('PIN incorreto!');
    }
    setPin('');
  };

  // Cálculos financeiros
  const getMonthTransactions = () => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth.getMonth() && 
             tDate.getFullYear() === currentMonth.getFullYear();
    });
  };

  const monthTransactions = getMonthTransactions();

  const totalReceitas = monthTransactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + parseFloat(t.value), 0);

  const totalDespesas = monthTransactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + parseFloat(t.value), 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  const totalInvestimentos = Object.values(investments).reduce((sum, val) => sum + val, 0);
  const reservaPercentual = totalInvestimentos > 0 
    ? ((investments.reserva / totalInvestimentos) * 100).toFixed(1)
    : 0;

  // Gastos por categoria
  const gastosPorCategoria = useMemo(() => {
    const categorias = {};
    monthTransactions
      .filter(t => t.type === 'despesa')
      .forEach(t => {
        categorias[t.category] = (categorias[t.category] || 0) + parseFloat(t.value);
      });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  // Dados comparativos (6 meses)
  const comparativoMeses = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear();
      });
      
      const receitas = monthTrans.filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + parseFloat(t.value), 0);
      const despesas = monthTrans.filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + parseFloat(t.value), 0);
      
      meses.push({
        mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas,
        despesas
      });
    }
    return meses;
  }, [transactions]);

  // Adicionar transação
  const handleAddTransaction = () => {
    if (!formData.value || !formData.description || !formData.category) {
      alert('Preencha todos os campos!');
      return;
    }

    const newTransaction = {
      ...formData,
      id: Date.now(),
      value: parseFloat(formData.value)
    };

    setTransactions([...transactions, newTransaction]);
    setFormData({
      type: 'receita',
      date: new Date().toISOString().split('T')[0],
      value: '',
      description: '',
      category: ''
    });
    setCurrentView('dashboard');
  };

  // Copiar mês anterior
  const copyPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    const prevTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === prevMonth.getMonth() && 
             tDate.getFullYear() === prevMonth.getFullYear();
    });

    const newTransactions = prevTransactions.map(t => ({
      ...t,
      id: Date.now() + Math.random(),
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), new Date(t.date).getDate())
        .toISOString().split('T')[0]
    }));

    setTransactions([...transactions, ...newTransactions]);
  };

  // Backup e Restaurar
  const handleBackup = () => {
    const data = {
      transactions,
      goals,
      investments,
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wesley-financas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setTransactions(data.transactions || []);
        setGoals(data.goals || []);
        setInvestments(data.investments || {});
        alert('Dados restaurados com sucesso!');
      } catch (error) {
        alert('Erro ao restaurar backup!');
      }
    };
    reader.readAsText(file);
  };

  // Adicionar meta
  const handleAddGoal = () => {
    if (!goalForm.category || !goalForm.limit) {
      alert('Preencha todos os campos!');
      return;
    }

    setGoals([...goals, {
      ...goalForm,
      id: Date.now(),
      limit: parseFloat(goalForm.limit)
    }]);

    setGoalForm({ category: '', limit: '' });
  };

  // Cores
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} w-80`}>
          <div className="text-center mb-6">
            <Lock className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🔒 Wesley Finanças
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {savedPin ? 'Digite seu PIN' : 'Crie seu PIN'}
            </p>
          </div>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Digite 4 dígitos"
            maxLength="4"
            className={`w-full p-3 rounded-lg text-center text-2xl tracking-widest mb-4 ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            💰 Wesley Finanças
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 font-semibold">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsLocked(true)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Lock className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {currentView === 'dashboard' && (
          <div className="space-y-4">
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm opacity-70 mb-2">Saldo Líquido</h3>
                <p className={`text-3xl font-bold ${saldoLiquido >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {showBalance ? `R$ ${saldoLiquido.toFixed(2)}` : '---'}
                </p>
              </div>
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm opacity-70 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Entradas
                </h3>
                <p className="text-2xl font-bold text-green-500">
                  {showBalance ? `R$ ${totalReceitas.toFixed(2)}` : '---'}
                </p>
              </div>
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm opacity-70 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Saídas
                </h3>
                <p className="text-2xl font-bold text-red-500">
                  {showBalance ? `R$ ${totalDespesas.toFixed(2)}` : '---'}
                </p>
              </div>
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-sm opacity-70 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> Reserva
                </h3>
                <p className="text-2xl font-bold text-blue-500">
                  {reservaPercentual}%
                </p>
                <p className="text-xs opacity-60 mt-1">
                  {showBalance ? `R$ ${investments.reserva.toFixed(2)}` : '---'}
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={gastosPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gastosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-semibold mb-4">Comparativo (Últimos 6 meses)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparativoMeses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10b981" />
                    <Bar dataKey="despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Opções */}
            <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyPreviousMonth}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" /> Copiar Mês Anterior
                </button>
                <button
                  onClick={handleBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" /> Backup
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 cursor-pointer">
                  <Upload className="w-4 h-4" /> Restaurar
                  <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                </label>
                <button
                  onClick={() => setCurrentView('annual')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Calendar className="w-4 h-4" /> Relatório Anual
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'extrato' && (
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">Extrato</h2>
            <div className="space-y-2">
              {monthTransactions.map(t => (
                <div key={t.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex justify-between items-center`}>
                  <div>
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-sm opacity-70">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className={`text-xl font-bold ${t.type === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'receita' ? '+' : '-'} R$ {t.value.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'novo' && (
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">Novo Lançamento</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({...formData, type: 'receita'})}
                  className={`flex-1 p-3 rounded-lg ${formData.type === 'receita' ? 'bg-green-600 text-white' : 'bg-gray-700'}`}
                >
                  Receita
                </button>
                <button
                  onClick={() => setFormData({...formData, type: 'despesa'})}
                  className={`flex-1 p-3 rounded-lg ${formData.type === 'despesa' ? 'bg-red-600 text-white' : 'bg-gray-700'}`}
                >
                  Despesa
                </button>
              </div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              />
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                placeholder="Valor"
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              />
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição"
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <option value="">Selecione a categoria</option>
                {categories[formData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={handleAddTransaction}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {currentView === 'metas' && (
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">🎯 Metas Financeiras</h2>
            <div className="space-y-4 mb-6">
              <select
                value={goalForm.category}
                onChange={(e) => setGoalForm({...goalForm, category: e.target.value})}
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                <option value="">Selecione a categoria</option>
                {categories.despesa.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="number"
                value={goalForm.limit}
                onChange={(e) => setGoalForm({...goalForm, limit: e.target.value})}
                placeholder="Limite de gastos"
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              />
              <button
                onClick={handleAddGoal}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Salvar Meta
              </button>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Acompanhamento</h3>
              {goals.map(goal => {
                const spent = monthTransactions
                  .filter(t => t.type === 'despesa' && t.category === goal.category)
                  .reduce((sum, t) => sum + parseFloat(t.value), 0);
                const percentage = (spent / goal.limit) * 100;
                
                return (
                  <div key={goal.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">{goal.category}</span>
                      <span>R$ {spent.toFixed(2)} / R$ {goal.limit.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{width: `${Math.min(percentage, 100)}%`}}
                      />
                    </div>
                    <p className="text-sm mt-1 opacity-70">{percentage.toFixed(1)}% utilizado</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'investimentos' && (
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">📈 Meus Ativos</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  reserva: '🛡️ Reserva (Liquidez)',
                  rendaFixa: '🔒 Renda Fixa',
                  acoes: '📈 Ações/FIIs',
                  cripto: '₿ Cripto',
                  veiculos: '🚙 Veículos'
                }).map(([key, label]) => (
                  <div key={key} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <label className="block mb-2 font-semibold">{label}</label>
                    <input
                      type="number"
                      value={investments[key]}
                      onChange={(e) => setInvestments({...investments, [key]: parseFloat(e.target.value) || 0})}
                      className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`