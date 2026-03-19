import React from 'react';

export const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-4 space-y-8">
      <h1 className="text-4xl font-serif text-poly-sand">Termos de Serviço</h1>
      <div className="bg-poly-dark-light p-8 rounded-[2rem] border border-poly-coral/20 space-y-6 text-poly-sand/80 leading-relaxed">
        <p>Bem-vindo ao Vendifree - Paraíso Privado. Ao aceder a esta plataforma, concorda com os seguintes termos:</p>
        <h2 className="text-2xl font-serif text-poly-coral">1. Aceitação dos Termos</h2>
        <p>Ao utilizar o Vendifree, compromete-se a respeitar todas as regras e regulamentos aplicáveis. Se não concordar com estes termos, não deverá utilizar a plataforma.</p>
        <h2 className="text-2xl font-serif text-poly-coral">2. Responsabilidade dos Utilizadores</h2>
        <p>Os utilizadores são responsáveis por toda a informação que publicam. A Vendifree não se responsabiliza por transações entre utilizadores.</p>
        <h2 className="text-2xl font-serif text-poly-coral">3. Pagamentos e Comissões</h2>
        <p>A Vendifree pode cobrar taxas sobre as transações realizadas na plataforma. Estas taxas serão comunicadas de forma transparente antes da conclusão da transação.</p>
        <h2 className="text-2xl font-serif text-poly-coral">4. Modificações</h2>
        <p>Reservamo-nos o direito de alterar estes termos a qualquer momento. As alterações entrarão em vigor assim que publicadas na plataforma.</p>
      </div>
    </div>
  );
};

export const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-4 space-y-8">
      <h1 className="text-4xl font-serif text-poly-sand">Política de Privacidade</h1>
      <div className="bg-poly-dark-light p-8 rounded-[2rem] border border-poly-coral/20 space-y-6 text-poly-sand/80 leading-relaxed">
        <p>A sua privacidade é importante para nós. Esta política explica como recolhemos, usamos e protegemos os seus dados.</p>
        <h2 className="text-2xl font-serif text-poly-coral">1. Recolha de Dados</h2>
        <p>Recolhemos informações básicas de perfil (nome, email, foto) quando faz login com o Google, bem como dados sobre os anúncios e mensagens que cria.</p>
        <h2 className="text-2xl font-serif text-poly-coral">2. Uso dos Dados</h2>
        <p>Os seus dados são usados para fornecer os serviços da plataforma, processar pagamentos e enviar notificações importantes.</p>
        <h2 className="text-2xl font-serif text-poly-coral">3. Partilha de Dados</h2>
        <p>Não vendemos os seus dados a terceiros. Apenas partilhamos informações com parceiros de pagamento (como o Stripe) para processar transações.</p>
        <h2 className="text-2xl font-serif text-poly-coral">4. Os Seus Direitos</h2>
        <p>Pode solicitar a eliminação da sua conta e de todos os seus dados a qualquer momento, contactando o nosso suporte.</p>
      </div>
    </div>
  );
};
