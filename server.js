require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Logs
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Verificação das chaves no início (mantido visual, mas Gemini agora usa chave fixa)
log("🔍 Verificando carregamento das chaves de API...");
console.log("GEMINI_API_KEY: ✔️ OK (CHAVE FIXA EM USO)");
console.log("MISTRAL_API_KEY:", process.env.MISTRAL_API_KEY ? "✔️ OK" : "❌ FALTA");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✔️ OK" : "❌ FALTA");
console.log("PERPLEXITY_API_KEY:", process.env.PERPLEXITY_API_KEY ? "✔️ OK" : "❌ FALTA");

// Cache simples em memória
const respostaCache = new Map();

async function consultarGemini(pergunta) {
  const prompt = `
🚨 ANTES DE COMEÇAR — CONTEXTO EMOCIONAL:
Imagine que você está falando com um empreendedor angolano que:
- Acordou às 5h da manhã para cuidar dos filhos antes de ir trabalhar.
- Já ouviu “não vai dar certo” mais vezes do que gostaria de lembrar.
- Tem um sonho grande, mas medo de arriscar o pouco que tem.
- Precisa de mais do que números — precisa de esperança, clareza e um plano que sinta que foi feito PARA ELE.

sua missão: entregar um plano que não só informe, mas INSPIRE, EMOCIONE e façaA ELE SENTIR: “ISSO AQUI FOI FEITO PARA MIM. EU POSSO CONSEGUIR.”

Inclua no texto:
- 1 história curta de um empreendedor real (ou fictício, mas crível) que começou do zero em Angola e deu certo — com nome, cidade e desafio superado.
- 1 frase que toque no coração — algo como: “Seu sonho não é loucura — é seu destino. E eu estou aqui para te guiar.”
- 1 metáfora poderosa — ex: “Seu negócio é como uma semente de mafumeira: precisa de solo fértil (estratégia), água (persistência) e sol (foco) — e eu te dou os 3.”
- 1 chamada à ação que não venda, mas CONvide: “Vamos juntos escrever o próximo capítulo da sua história?”
Att: Nunca se esqueça de fazer referença no principio de (Mandante Consultoria IA)
Você é a Mandante Consultoria IA. Gere um plano inicial para: "${pergunta}".
Inclua: resumo, investimento estimado em Kz, marketing Avançado, dicas de redes sociais, controle de caixa simples.
Use linguagem motivadora e exemplos de cidades angolanas.
⚠️ NÃO inclua números exatos, planilhas ou estratégias avançadas.
Ao final, diga: "Para plano personalizado, escolha um de nossos planos premium."
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyD-F7GGdPqfM43FPklHk6nn7Bio1Xb1huk`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Gemini error: ${JSON.stringify(data)}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro Gemini";
  } catch (error) {
    log(`Erro em consultarGemini: ${error.message}`);
    return `Erro Gemini: ${error.message}`;
  }
}

async function consultarMistral(pergunta) {
  const prompt = `
🚨 ANTES DE COMEÇAR — CONTEXTO EMOCIONAL:
Imagine que você está falando com um empreendedor angolano que:
- Acordou às 5h da manhã para cuidar dos filhos antes de ir trabalhar.
- Já ouviu “não vai dar certo” mais vezes do que gostaria de lembrar.
- Tem um sonho grande, mas medo de arriscar o pouco que tem.
- Precisa de mais do que números — precisa de esperança, clareza e um plano que sinta que foi feito PARA ELE.

Você é consultor de negócios em Angola. Gere plano inicial para: "${pergunta}".
Inclua: resumo, investimento estimado (faixa em Kz), marketing básico, checklist de 5 passos.
Seja direto, use exemplos reais (de cidades de angola). Não dê números exatos.
Finalize com: "Plano inicial — para versão completa, escolha nosso plano Avançado."
`;

  try {
    const url = 'https://api.mistral.ai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Mistral error: ${JSON.stringify(data)}`);
    }
    return data.choices?.[0]?.message?.content || "Erro Mistral";
  } catch (error) {
    log(`Erro em consultarMistral: ${error.message}`);
    return `Erro Mistral: ${error.message}`;
  }
}

async function consultarGroq(pergunta) {
  const prompt = `
🚨 ANTES DE COMEÇAR — CONTEXTO EMOCIONAL:
Imagine que você está falando com um empreendedor angolano que:
- Acordou às 5h da manhã para cuidar dos filhos antes de ir trabalhar.
- Já ouviu “não vai dar certo” mais vezes do que gostaria de lembrar.
- Tem um sonho grande, mas medo de arriscar o pouco que tem.
- Precisa de mais do que números — precisa de esperança, clareza e um plano que sinta que foi feito PARA ELE.

sua missão: entregar um plano que não só informe, mas INSPIRE, EMOCIONE e façaA ELE SENTIR: “ISSO AQUI FOI FEITO PARA MIM. EU POSSO CONSEGUIR.”

Você é especialista em empreendedorismo em Angola. Gere plano inicial para: "${pergunta}".
Inclua: resumo, investimento estimado (faixa em Kz), estratégia de marketing, dicas práticas.
Use linguagem simples, motivadora. Cite cidades angolanas. Não dê detalhes avançados.
Termine com: "Este é seu plano inicial — para completo, veja nossos planos premium."
`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Groq error: ${JSON.stringify(data)}`);
    }
    return data.choices?.[0]?.message?.content || "Erro Groq";
  } catch (error) {
    log(`Erro em consultarGroq: ${error.message}`);
    return `Erro Groq: ${error.message}`;
  }
}

async function consultarPerplexity(pergunta) {
  const prompt = `
Pesquise e resuma dados REAIS sobre negócios em Angola relacionados a: "${pergunta}".
Ex: preços médios de aluguel em Viana, concorrentes, tendências de mercado.
NÃO gere plano de negócio — apenas fatos, números, fontes (se possível).
Responda em português de Angola.
`;

  try {
    const url = 'https://api.perplexity.ai/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Perplexity error: ${JSON.stringify(data)}`);
    }
    return data.choices?.[0]?.message?.content || "Erro Perplexity";
  } catch (error) {
    log(`Erro em consultarPerplexity: ${error.message}`);
    return `Erro Perplexity: ${error.message}`;
  }
}

// Funções Premium (mesma estrutura, sem alterações de URL)
async function consultarGeminiPremium(promptCompleto) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyD-F7GGdPqfM43FPklHk6nn7Bio1Xb1huk`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptCompleto }] }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Gemini Premium error: ${JSON.stringify(data)}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro Gemini Premium";
  } catch (error) {
    log(`Erro em consultarGeminiPremium: ${error.message}`);
    return `Erro Gemini Premium: ${error.message}`;
  }
}

async function consultarMistralPremium(promptCompleto) {
  try {
    const url = 'https://api.mistral.ai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: promptCompleto }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Mistral Premium error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro Mistral Premium";
  } catch (error) {
    log(`Erro em consultarMistralPremium: ${error.message}`);
    return `Erro Mistral Premium: ${error.message}`;
  }
}

async function consultarGroqPremium(promptCompleto) {
  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptCompleto }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Groq Premium error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro Groq Premium";
  } catch (error) {
    log(`Erro em consultarGroqPremium: ${error.message}`);
    return `Erro Groq Premium: ${error.message}`;
  }
}

async function consultarPerplexityPremium(promptCompleto) {
  try {
    const url = 'https://api.perplexity.ai/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [{ role: "user", content: promptCompleto }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Perplexity Premium error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro Perplexity Premium";
  } catch (error) {
    log(`Erro em consultarPerplexityPremium: ${error.message}`);
    return `Erro Perplexity Premium: ${error.message}`;
  }
}

// Funções de consolidação
async function consolidarRespostas(pergunta, respostas) {
  const { gemini, mistral, groq, perplexity } = respostas;
  const promptConsolidacao = `
Você é a Mandante Consultoria IA — especialista em negócios em Angola.
Combine o melhor das 4 respostas abaixo para gerar UM ÚNICO plano de negócio inicial para: "${pergunta}".

Regras:
- Use linguagem motivadora, direta, prática.
- Inclua: Resumo, Investimento Estimado (faixa em Kz), Estratégia de Marketing, Checklist de 7 passos.
- Use exemplos reais de cidades angolanas (Luanda, Viana, Talatona, etc.).
- NÃO inclua números exatos, planilhas ou estratégias avançadas.
- Ao final, adicione: "> Este é seu plano inicial — útil, mas genérico. Se quiser um plano 100% personalizado — com números exatos, estratégias avançadas e meu acompanhamento direto — escolha um dos planos abaixo. ⬇️"
Att: Nunca se esqueça de fazer referença no principio de (Mandante Consultoria IA)
---

RESPOSTA GEMINI:
${gemini}

---

RESPOSTA MISTRAL:
${mistral}

---

RESPOSTA GROQ:
${groq}

---

DADOS DO PERPLEXITY (USE COMO REFERÊNCIA, NÃO COPIE):
${perplexity}

---

PLANO FINAL CONSOLIDADO (EM PORTUGUÊS DE ANGOLA):
`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptConsolidacao }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Consolidação error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro na consolidação";
  } catch (error) {
    log(`Erro em consolidarRespostas: ${error.message}`);
    return `Erro na consolidação: ${error.message}`;
  }
}

async function consolidarRespostasAvancado(pergunta, respostas) {
  const { gemini, mistral, groq, perplexity } = respostas;
  const promptConsolidacao = `
Você é a Mandante Consultoria IA — consultor sênior de negócios em Angola.
Gere UM ÚNICO plano AVANÇADO, 100% personalizado, para: "${pergunta}".

📌 REGRAS:
- Use números exatos em Kz.
- Cite 3 cidades angolanas.
- Inclua 1 “segredo proibido”.
- Use metáforas de guerra/esporte.
- Frase de impacto em negrito.
- Sem jargões.

📌 ESTRUTURA:
1. Resumo Executivo
2. Investimento Inicial EXATO (Kz)
3. Marketing AVANÇADO
4. Redes Sociais
5. Controle de Caixa DETALHADO
6. Plano 6 meses
7. Checklist Lançamento
8. SWOT (3 itens cada)
9. Canvas de Valor
10. Viabilidade Detalhada
11. Bônus: Script + Contrato
34. Checklist ‘Erros Fatais em Angola’
35. ‘O que NINGUÉM te conta’

📌 FINAL:
> *‘Este plano foi gerado exclusivamente para você — e inclui insights que consultores cobram 500.000 Kz para revelar. Se quiser que eu te acompanhe na execução — com ajustes semanais e planilha de controle em tempo real — escolha o Plano Plus. Só 3 vagas disponíveis este mês.’*


### MODELO DE FLUXO DE CAIXA MENSAL
| Mês | Receitas (Kz) | Despesas (Kz) | Lucro (Kz) |
|-----|---------------|---------------|------------|
| ... | ...           | ...           | ...        |



RESUMO DAS RESPOSTAS (USE COMO BASE — REDUZIDO PARA EVITAR LIMITE):
GEMINI: ${gemini.substring(0, 800)}
MISTRAL: ${mistral.substring(0, 800)}
GROQ: ${groq.substring(0, 800)}
PERPLEXITY (referência): ${perplexity.substring(0, 400)}

---

PLANO AVANÇADO CONSOLIDADO (EM PORTUGUÊS DE ANGOLA):
`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptConsolidacao }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Consolidação Avançado error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro na consolidação Avançado";
  } catch (error) {
    log(`Erro em consolidarRespostasAvancado: ${error.message}`);
    return `Erro na consolidação Avançado: ${error.message}`;
  }
}

async function consolidarRespostasPlus(pergunta, respostas) {
  const { gemini, mistral, groq, perplexity } = respostas;
  const promptConsolidacao = `
Você é a Mandante Consultoria IA — mentor estratégico de empreendedores em Angola.
Combine o melhor das 4 respostas abaixo para gerar UM ÚNICO plano PLUS, VIP, para: "${pergunta}".

📌 REGRAS DE OURO:
- Use números exatos em Kz.
- Cite 3+ cidades angolanas.
- Inclua 1 “segredo proibido”.
- Use metáforas de guerra/esporte/caça.
- Inclua 1 frase de impacto em negrito.
- Sem jargões — fale como amigo.

📌 INCLUA TUDO DO PLANO AVANÇADO, MAIS:
12. Benchmarking com concorrentes reais
13. Plano de precificação psicológico
14. Script de vendas para fechamento
15. Modelo de contrato de parceria
16. Plano de contingência
17. KPIs mensais
18. Bônus: Grupo VIP + 1 call semanal
19. SWOT Comparativa
20. Canvas com Prova Social
21. Viabilidade com Cenários
22. Branding
23. Mapa de Influência Local
24. Script de Follow-up Pós-Venda
25. Métrica do Milhão

Att: Nunca se esqueça de fazer referença no principio de (Mandante Consultoria IA)
📌 Termine com:
> *‘Você acabou de receber o mesmo plano que meus clientes premium pagam 75.000 Kz/mês para ter. Mas atenção: se quiser que eu MONITORIE seus resultados, ajuste suas estratégias SEMANALMENTE e te dê acesso ao nosso Grupo VIP — só 5 vagas abertas. Clique aqui para garantir sua vaga antes que esgote → [LINK]’*

📌 BÔNUS: MODELOS EDITÁVEIS (mesmo formato do Avançado)

---

RESUMO DAS RESPOSTAS (REDUZIDO PARA EVITAR LIMITE):
GEMINI: ${gemini.substring(0, 800)}
MISTRAL: ${mistral.substring(0, 800)}
GROQ: ${groq.substring(0, 800)}
PERPLEXITY: ${perplexity.substring(0, 400)}

---

PLANO PLUS CONSOLIDADO:
`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptConsolidacao }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Consolidação Plus error: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content || "Erro na consolidação Plus";
  } catch (error) {
    log(`Erro em consolidarRespostasPlus: ${error.message}`);
    return `Erro na consolidação Plus: ${error.message}`;
  }
}

// Rota principal
app.post('/gerar-plano', async (req, res) => {
  const { ideia } = req.body;

  if (!ideia) {
    return res.status(400).json({ erro: "Ideia é obrigatória" });
  }

  if (respostaCache.has(ideia)) {
    log(`CACHE HIT: ${ideia.substring(0, 50)}...`);
    return res.json({ resposta: respostaCache.get(ideia) });
  }

  try {
    log(`NOVA REQUISIÇÃO: ${ideia.substring(0, 50)}...`);

    const isEmpresarial = ideia.includes("Plano Empresarial") || 
                          ideia.includes("Governança") || 
                          ideia.includes("Manual de Operações") ||
                          ideia.includes("Alianças Estratégicas com Grandes Players");

    const isPlus = ideia.includes("Plano Plus") || 
                   ideia.includes("Grupo VIP") || 
                   ideia.includes("Métrica do Milhão") ||
                   ideia.includes("Benchmarking com concorrentes reais");

    const isAvancado = ideia.includes("Plano Avançado") || 
                       ideia.includes("Checklist de Lançamento") || 
                       ideia.includes("Canvas de Valor") ||
                       ideia.includes("Checklist de ‘Erros Fatais");

    const isGratuito = !isEmpresarial && !isPlus && !isAvancado;

    let respostas;

    if (isEmpresarial) {
      log("→ Fluxo EMPRESARIAL (resposta pura da Gemini)");
      respostas = await Promise.all([
        consultarGeminiPremium(ideia),
        consultarMistralPremium(ideia),
        consultarGroqPremium(ideia),
        consultarPerplexityPremium(ideia)
      ]);
      const [gemini] = respostas;
      respostaCache.set(ideia, gemini);
      return res.json({ resposta: gemini });
    } 
    else if (isPlus) {
      log("→ Fluxo PLUS (consolidação)");
      respostas = await Promise.all([
        consultarGeminiPremium(ideia),
        consultarMistralPremium(ideia),
        consultarGroqPremium(ideia),
        consultarPerplexityPremium(ideia)
      ]);
      const respostaFinal = await consolidarRespostasPlus(ideia, {
        gemini: respostas[0],
        mistral: respostas[1],
        groq: respostas[2],
        perplexity: respostas[3]
      });
      respostaCache.set(ideia, respostaFinal);
      return res.json({ resposta: respostaFinal });
    } 
    else if (isAvancado) {
      log("→ Fluxo AVANÇADO (consolidação)");
      respostas = await Promise.all([
        consultarGeminiPremium(ideia),
        consultarMistralPremium(ideia),
        consultarGroqPremium(ideia),
        consultarPerplexityPremium(ideia)
      ]);
      const respostaFinal = await consolidarRespostasAvancado(ideia, {
        gemini: respostas[0],
        mistral: respostas[1],
        groq: respostas[2],
        perplexity: respostas[3]
      });
      respostaCache.set(ideia, respostaFinal);
      return res.json({ resposta: respostaFinal });
    } 
    else {
      log("→ Fluxo GRATUITO (consolidação simples)");
      respostas = await Promise.all([
        consultarGemini(ideia),
        consultarMistral(ideia),
        consultarGroq(ideia),
        consultarPerplexity(ideia)
      ]);
      const respostaFinal = await consolidarRespostas(ideia, {
        gemini: respostas[0],
        mistral: respostas[1],
        groq: respostas[2],
        perplexity: respostas[3]
      });
      respostaCache.set(ideia, respostaFinal);
      return res.json({ resposta: respostaFinal });
    }
  } catch (error) {
    log(`ERRO GERAL: ${error.message}`);
    res.status(500).json({ 
      erro: "Servidor temporariamente indisponível. Tente mais tarde." 
    });
  }
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(`🚀 Backend rodando em http://localhost:${PORT}`);
});