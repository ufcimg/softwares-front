(function(){
  "use strict";

  // ================= estado =================

  function instituicaoVazia(){
    return { razao_social: "", cnpj: "", endereco: "" };
  }

  function autorVazio(){
    return {
      nome: "", nacionalidade: "", cpf: "",
      instituicao_tipo: "", instituicao_parceira_idx: "",
      campus: "", tipo_vinculo: "", endereco_independente: "",
      telefone: "", email: "", email_alternativo: "",
      qualificacao_profissional: ""
    };
  }

  var state = {
    linguagens: [],
    area_aplicacao: [],
    tipo_programa: [],
    palavras_chave: [],
    instituicoes_parceiras: [],
    autores: [autorVazio()]
  };

  var formularioSujo = false;
  var currentStepId = "identificacao";
  var touchedEls = new WeakSet();
  var stepsTouched = {};

  var STEPS = [
    { id: "identificacao", titulo: "Identificação" },
    { id: "maturidade", titulo: "Maturidade e interesse", visibleIf: function(){ return trlExigeMaturidade() || temEmpresaInteressada(); } },
    { id: "instituicoes", titulo: "Instituições" },
    { id: "autores", titulo: "Autores" },
    { id: "classificacao", titulo: "Classificação" },
    { id: "parceria", titulo: "Parceria", visibleIf: function(){ return state.instituicoes_parceiras.length > 0; } },
    { id: "artefato", titulo: "Programa" },
    { id: "declaracoes", titulo: "Declarações" },
    { id: "revisao", titulo: "Revisão" }
  ];

  function trlExigeMaturidade(){
    var v = parseInt($("trl").value, 10);
    return !isNaN(v) && v >= TRL_MINIMO_MATURIDADE;
  }

  // Pode haver empresa interessada em qualquer nível de TRL: a pergunta é da
  // Identificação e independe do TRL. A etapa Maturidade mostra a justificativa
  // só com TRL alto e os dados da empresa só com a resposta "Sim".
  function temEmpresaInteressada(){
    var marcado = document.querySelector('input[name="empresa_interessada"]:checked');
    return !!marcado && marcado.value === "sim";
  }

  // Tipos de interesse marcados (valores de INTERESSE_TIPOS), na ordem da lista.
  function tiposDeInteresse(){
    var marcados = {};
    document.querySelectorAll("#interesse-tipos input[type=checkbox]").forEach(function(c){
      if(c.checked) marcados[c.value] = true;
    });
    return INTERESSE_TIPOS.map(function(t){ return t.valor; }).filter(function(v){ return marcados[v]; });
  }

  function rotuloDoInteresse(valor){
    var t = INTERESSE_TIPOS.filter(function(x){ return x.valor === valor; })[0];
    return t ? t.rotulo : valor;
  }

  function construirTiposDeInteresse(){
    var container = $("interesse-tipos");
    INTERESSE_TIPOS.forEach(function(tipo){
      var label = document.createElement("label");
      label.className = "chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = tipo.valor;
      input.addEventListener("change", function(){ label.classList.toggle("checked", input.checked); });
      label.appendChild(input);
      label.appendChild(document.createTextNode(tipo.rotulo));
      container.appendChild(label);
    });
  }

  function atualizarBlocosMaturidade(){
    var blocoTrl = $("maturidade-bloco-trl");
    var blocoEmpresa = $("maturidade-bloco-empresa");
    // O passo de anexar os comprovantes do TRL, nas instruções finais, só existe com TRL alto.
    if($("passo-anexos-trl")) $("passo-anexos-trl").hidden = !trlExigeMaturidade();
    // E o da carta de manifestação de interesse, só com empresa interessada (em qualquer TRL).
    if($("passo-anexo-carta")) $("passo-anexo-carta").hidden = !temEmpresaInteressada();
    if(blocoTrl) blocoTrl.hidden = !trlExigeMaturidade();
    if(blocoEmpresa) blocoEmpresa.hidden = !temEmpresaInteressada();
    var tipos = tiposDeInteresse();
    if($("interesse-parceria-wrap")) $("interesse-parceria-wrap").hidden = tipos.indexOf("parceria_em_andamento") === -1;
    if($("interesse-outro-wrap")) $("interesse-outro-wrap").hidden = tipos.indexOf("outro") === -1;
  }

  // ================= helpers dom =================

  function $(id){ return document.getElementById(id); }

  function nomeESiglaInstituicao(){ return INSTITUICAO.nome + " (" + INSTITUICAO.sigla + ")"; }

  function normalize(s){
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function escapeHtml(s){
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function flattenGroups(groups){
    var flat = [];
    groups.forEach(function(g){
      var groupName = g[0];
      g[1].forEach(function(row){
        var code = row[0], short = row[1], desc = row[2];
        var value = code + " - " + short;
        flat.push({
          code: code, short: short, desc: desc, group: groupName, value: value,
          search: normalize([code, short, desc, groupName].join(" "))
        });
      });
    });
    return flat;
  }

  function flattenFlatPairs(pairs){
    return pairs.map(function(p){
      var label = p[0], categoria = p[1];
      return {
        code: "", short: label, desc: "", group: categoria, value: label,
        search: normalize(label + " " + categoria)
      };
    });
  }

  var CAMPO_APLICACAO_ITEMS = flattenGroups(CAMPO_APLICACAO_GRUPOS);
  var TIPO_PROGRAMA_ITEMS = flattenGroups(TIPO_PROGRAMA_GRUPOS);
  var QUALIFICACAO_ITEMS = flattenFlatPairs(QUALIFICACAO_GRUPOS_RAW);

  function rotuloVinculo(v){
    return { servidor: "Servidor", estudante: "Estudante", temporario: "Vínculo temporário", terceirizado: "Terceirizado", parceiro: "Parceiro" }[v] || "—";
  }

  // Rótulos e formatos só do texto impresso no PDF; o JSON continua com os valores crus.
  function rotuloOrigem(v){
    return { pesquisa: "Pesquisa", ensino: "Ensino", extensao: "Extensão", projeto_fomento: "Projeto com fomento", outro: "Outro" }[v] || v || "—";
  }

  function rotuloTrl(n){
    var t = TRL_NIVEIS.filter(function(x){ return x.nivel === Number(n); })[0];
    return t ? "TRL " + t.nivel + " — " + t.titulo : String(n || "—");
  }

  // "2026-10-13" -> "13/10/2026"; qualquer outra coisa passa como veio.
  function dataBr(iso){
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : iso;
  }

  // 11 dígitos -> 000.000.000-00; qualquer outra coisa passa como veio.
  function cpfBr(cpf){
    var d = String(cpf || "").replace(/\D/g, "");
    return d.length === 11 ? d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9) : cpf;
  }

  // ================= tags genéricas =================

  function renderTags(key){
    var listIds = {
      linguagens: "linguagens-tags",
      area_aplicacao: "area-tags",
      tipo_programa: "tipo-tags",
      palavras_chave: "palavras-tags"
    };
    var list = $(listIds[key]);
    list.innerHTML = "";
    state[key].forEach(function(value){
      var tag = document.createElement("span");
      tag.className = "tag";
      var text = document.createElement("span");
      text.textContent = value;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.setAttribute("aria-label", "Remover " + value);
      btn.addEventListener("click", function(){ removeTag(key, value); });
      tag.appendChild(text);
      tag.appendChild(btn);
      list.appendChild(tag);
    });
  }

  function addTagValue(key, value){
    value = (value || "").trim();
    if(!value || state[key].indexOf(value) !== -1) return false;
    if(key === "palavras_chave" && state[key].length >= MAX_PALAVRAS_CHAVE) return false;
    state[key].push(value);
    renderTags(key);
    renderTudo();
    return true;
  }

  function removeTag(key, value){
    var idx = state[key].indexOf(value);
    if(idx !== -1) state[key].splice(idx, 1);
    if(key === "linguagens"){
      var inputs = $("linguagens-chips").querySelectorAll("input[type=checkbox]");
      inputs.forEach(function(inp){
        if(inp.value === value){
          inp.checked = false;
          inp.closest(".chip").classList.remove("checked");
        }
      });
    }
    renderTags(key);
    renderTudo();
  }

  function replaceTagValues(key, values){
    state[key] = Array.isArray(values) ? values.slice() : [];
    renderTags(key);
    if(key === "linguagens"){
      var inputs = $("linguagens-chips").querySelectorAll("input[type=checkbox]");
      inputs.forEach(function(inp){
        var checked = state.linguagens.indexOf(inp.value) !== -1;
        inp.checked = checked;
        inp.closest(".chip").classList.toggle("checked", checked);
      });
    }
  }

  function buildChipPicker(containerId, options, stateKey){
    var container = $(containerId);
    options.forEach(function(opt){
      var label = document.createElement("label");
      label.className = "chip";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = opt;
      input.addEventListener("change", function(){
        label.classList.toggle("checked", input.checked);
        if(input.checked){ addTagValue(stateKey, opt); }
        else { removeTag(stateKey, opt); }
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      container.appendChild(label);
    });
  }

  // ================= autocomplete genérico =================

  function attachAutocomplete(input, listbox, items, opts){
    opts = opts || {};
    var minChars = opts.minChars != null ? opts.minChars : 2;
    var onSelect = opts.onSelect || function(){};
    var semGrupo = !!opts.semGrupo;

    function close(){ listbox.hidden = true; listbox.innerHTML = ""; }

    function renderResults(){
      var q = normalize(input.value);
      listbox.innerHTML = "";
      if(q.length < minChars){
        var hint = document.createElement("div");
        hint.className = "combo-hint";
        hint.textContent = "Digite pelo menos " + minChars + " letra(s) para buscar.";
        listbox.appendChild(hint);
        listbox.hidden = false;
        return;
      }
      var matches = items.filter(function(it){ return it.search.indexOf(q) !== -1; });
      if(matches.length === 0){
        var empty = document.createElement("div");
        empty.className = "combo-empty";
        empty.textContent = "Nenhum item encontrado para “" + input.value + "”.";
        listbox.appendChild(empty);
        listbox.hidden = false;
        return;
      }
      var shown = matches.slice(0, MAX_RESULTS);
      var lastGroup = null;
      shown.forEach(function(it){
        if(!semGrupo && it.group !== lastGroup){
          var gl = document.createElement("div");
          gl.className = "combo-group-label";
          gl.textContent = it.group;
          listbox.appendChild(gl);
          lastGroup = it.group;
        }
        var opt = document.createElement("button");
        opt.type = "button";
        opt.className = "combo-option";
        var codeSpan = it.code ? "<span class=\"code\">" + escapeHtml(it.code) + "</span>" : "";
        var descHtml = it.desc ? "<span class=\"desc\">" + escapeHtml(it.desc) + "</span>" : "";
        opt.innerHTML = codeSpan + escapeHtml(it.short) + descHtml;
        opt.addEventListener("click", function(){
          onSelect(it);
          close();
        });
        listbox.appendChild(opt);
      });
      if(matches.length > shown.length){
        var more = document.createElement("div");
        more.className = "combo-more";
        more.textContent = (matches.length - shown.length) + " outro(s) resultado(s) — refine a busca para ver.";
        listbox.appendChild(more);
      }
      listbox.hidden = false;
    }

    input.addEventListener("input", renderResults);
    input.addEventListener("focus", renderResults);
    input.addEventListener("keydown", function(e){
      if(e.key === "Escape"){ close(); }
      if(e.key === "Enter"){
        e.preventDefault();
        var first = listbox.querySelector(".combo-option");
        if(first) first.click();
      }
    });
    document.addEventListener("click", function(e){
      if(!input.contains(e.target) && !listbox.contains(e.target)) close();
    });
  }

  function buildSearchPicker(inputId, listboxId, items, stateKey){
    var input = $(inputId);
    var listbox = $(listboxId);
    attachAutocomplete(input, listbox, items, {
      minChars: 2,
      onSelect: function(it){
        addTagValue(stateKey, it.value);
        input.value = "";
        input.focus();
      }
    });
  }

  // ================= instituições parceiras =================

  function criarCardInstituicao(inst, index){
    var fragmento = $("tpl-instituicao").content.cloneNode(true);
    var card = fragmento.querySelector(".card");
    card.querySelector(".instituicao-titulo").textContent = inst.razao_social || ("Instituição parceira " + (index + 1));

    card.querySelector('[data-action="remover"]').addEventListener("click", function(){
      state.instituicoes_parceiras.splice(index, 1);
      renderInstituicoes();
      renderAutores();
      renderCotitularidade();
      renderTudo();
    });

    card.querySelectorAll("[data-campo]").forEach(function(campo){
      var nome = campo.dataset.campo;
      campo.value = inst[nome] != null ? inst[nome] : "";
    });

    return card;
  }

  function renderInstituicoes(){
    var container = $("instituicoes-list");
    container.innerHTML = "";
    state.instituicoes_parceiras.forEach(function(inst, i){
      container.appendChild(criarCardInstituicao(inst, i));
    });
  }

  function sincronizarCampoInstituicao(e){
    var campo = e.target.closest("[data-campo]");
    if(!campo) return;
    var card = e.target.closest(".card");
    var lista = $("instituicoes-list");
    var index = Array.prototype.indexOf.call(lista.children, card);
    if(index === -1) return;
    state.instituicoes_parceiras[index][campo.dataset.campo] = campo.value;
    var titulo = card.querySelector(".instituicao-titulo");
    if(titulo){
      titulo.textContent = state.instituicoes_parceiras[index].razao_social || ("Instituição parceira " + (index + 1));
    }
    renderAutores();
    renderCotitularidade();
  }

  // ================= autores =================

  function popularSelectCampus(selectEl, autor){
    selectEl.innerHTML = '<option value="">Selecione</option>';
    CAMPI_INSTITUICAO.forEach(function(campus){
      var opt = document.createElement("option");
      opt.value = campus;
      opt.textContent = campus;
      if(autor.campus === campus) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function popularSelectParceira(selectEl, autor){
    selectEl.innerHTML = '<option value="">Selecione</option>';
    state.instituicoes_parceiras.forEach(function(inst, i){
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = inst.razao_social || ("Instituição parceira " + (i + 1));
      if(String(autor.instituicao_parceira_idx) === String(i)) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  function atualizarPreviewEnderecoParceira(card, autor){
    var preview = card.querySelector(".endereco-preview");
    if(!preview) return;
    var inst = state.instituicoes_parceiras[autor.instituicao_parceira_idx];
    preview.textContent = (inst && inst.endereco)
      ? ("Endereço (da instituição): " + inst.endereco)
      : "Selecione a instituição parceira para ver o endereço.";
  }

  function atualizarVisibilidadeAutor(card, autor){
    // Vínculo é único por autor: para instituição parceira é sempre "parceiro"
    // (não é uma escolha — é decorrência de a instituição não ser a própria),
    // e para inventor independente não existe vínculo institucional. Só quando a
    // instituição é a própria o vínculo é uma escolha real, feita no combo.
    if(autor.instituicao_tipo === "parceira"){
      autor.tipo_vinculo = "parceiro";
    } else if(autor.instituicao_tipo === "independente"){
      autor.tipo_vinculo = "";
    }
    card.querySelector(".bloco-propria").hidden = autor.instituicao_tipo !== "propria";
    card.querySelector(".bloco-parceira").hidden = autor.instituicao_tipo !== "parceira";
    card.querySelector(".bloco-independente").hidden = autor.instituicao_tipo !== "independente";
    // Telefone: só quem é da instituição própria pode deixá-lo em branco.
    card.querySelector(".telefone-req").textContent =
      (autor.instituicao_tipo === "parceira" || autor.instituicao_tipo === "independente") ? "*" : "";
    card.querySelector(".email-alt-req").textContent =
      (autor.instituicao_tipo === "propria" && autor.tipo_vinculo === "temporario") ? "obrigatório" : "";
    card.querySelector(".email-dominio-hint").hidden =
      !(autor.instituicao_tipo === "propria" && (autor.tipo_vinculo === "servidor" || autor.tipo_vinculo === "temporario"));
    if(autor.instituicao_tipo === "parceira"){
      atualizarPreviewEnderecoParceira(card, autor);
    }
  }

  function criarCardAutor(autor, index){
    var fragmento = $("tpl-autor").content.cloneNode(true);
    var card = fragmento.querySelector(".card");
    card.querySelector(".autor-titulo").textContent = index === 0 ? "Autor correspondente" : ("Autor " + (index + 1));

    var removerBtn = card.querySelector('[data-action="remover"]');
    // O primeiro autor é o autor correspondente e não pode ser removido; os demais podem.
    if(index === 0){
      removerBtn.hidden = true;
    } else {
      removerBtn.addEventListener("click", function(){
        state.autores.splice(index, 1);
        renderAutores();
        renderTudo();
      });
    }

    card.querySelectorAll("[data-campo]").forEach(function(campo){
      var nome = campo.dataset.campo;
      if(nome === "campus" || nome === "instituicao_parceira_idx") return;
      campo.value = autor[nome] != null ? autor[nome] : "";
    });

    popularSelectCampus(card.querySelector('[data-campo="campus"]'), autor);
    popularSelectParceira(card.querySelector('[data-campo="instituicao_parceira_idx"]'), autor);

    var qualInput = card.querySelector('[data-campo="qualificacao_profissional"]');
    var qualListbox = card.querySelector(".qualificacao-listbox");
    attachAutocomplete(qualInput, qualListbox, QUALIFICACAO_ITEMS, {
      minChars: 1,
      semGrupo: true,
      onSelect: function(it){
        qualInput.value = it.value;
        var indiceAtual = Array.prototype.indexOf.call($("autores-list").children, card);
        if(indiceAtual !== -1) state.autores[indiceAtual].qualificacao_profissional = it.value;
        renderTudo();
      }
    });

    atualizarVisibilidadeAutor(card, autor);
    return card;
  }

  function renderAutores(){
    var container = $("autores-list");
    container.innerHTML = "";
    state.autores.forEach(function(autor, i){
      container.appendChild(criarCardAutor(autor, i));
    });
  }

  function sincronizarCampoAutor(e){
    var campo = e.target.closest("[data-campo]");
    if(!campo) return;
    var card = e.target.closest(".card");
    var lista = $("autores-list");
    var index = Array.prototype.indexOf.call(lista.children, card);
    if(index === -1) return;
    state.autores[index][campo.dataset.campo] = campo.value;
    if(["instituicao_tipo", "tipo_vinculo", "instituicao_parceira_idx"].indexOf(campo.dataset.campo) !== -1){
      atualizarVisibilidadeAutor(card, state.autores[index]);
    }
  }

  // ================= cotitularidade (etapa Parceria) =================

  // As parceiras, na ordem das linhas da etapa (data-idx). Identifica cada
  // item pelo instituicao_tipo, nunca pela posição nem pelo nome.
  function cotitularesParceiras(cotitularidade){
    return cotitularidade.filter(function(c){ return c.instituicao_tipo !== "propria"; });
  }

  function renderCotitularidade(){
    var container = $("cotitularidade-parceiras-list");
    if(!container) return;
    var atuais = {};
    container.querySelectorAll("[data-idx]").forEach(function(inp){
      atuais[inp.getAttribute("data-idx")] = inp.value;
    });
    container.innerHTML = "";
    renderJustificativasParceiras();
    state.instituicoes_parceiras.forEach(function(inst, i){
      var row = document.createElement("div");
      row.className = "cotitularidade-row";

      var f1 = document.createElement("div");
      f1.className = "field";
      var label = document.createElement("label");
      label.textContent = inst.razao_social || ("Instituição parceira " + (i + 1));
      f1.appendChild(label);

      var f2 = document.createElement("div");
      f2.className = "field";
      var labelPct = document.createElement("label");
      labelPct.textContent = "%";
      var input = document.createElement("input");
      input.type = "number";
      input.min = "0"; input.max = "100"; input.step = "1";
      input.setAttribute("data-idx", String(i));
      input.value = atuais.hasOwnProperty(String(i)) ? atuais[String(i)] : "";
      f2.appendChild(labelPct);
      f2.appendChild(input);

      row.appendChild(f1);
      row.appendChild(f2);
      container.appendChild(row);
    });
  }

  function renderJustificativasParceiras(){
    var container = $("cotitularidade-justificativas-list");
    if(!container) return;
    var atuais = {};
    container.querySelectorAll("[data-just-idx]").forEach(function(ta){
      atuais[ta.getAttribute("data-just-idx")] = ta.value;
    });
    container.innerHTML = "";
    state.instituicoes_parceiras.forEach(function(inst, i){
      var campo = document.createElement("div");
      campo.className = "field";

      var id = "cotitularidade-just-" + i;
      var label = document.createElement("label");
      label.setAttribute("for", id);
      label.textContent = inst.razao_social || ("Instituição parceira " + (i + 1));

      var ta = document.createElement("textarea");
      ta.id = id;
      ta.className = "textarea-paragrafo";
      ta.setAttribute("data-just-idx", String(i));
      ta.value = atuais.hasOwnProperty(String(i)) ? atuais[String(i)] : "";

      var contador = document.createElement("p");
      contador.className = "char-count";
      function atualizarContador(){
        var n = ta.value.length;
        contador.textContent = n + " caracteres (mínimo " + MIN_CARACTERES_PARAGRAFO + ")";
        contador.classList.toggle("short", n < MIN_CARACTERES_PARAGRAFO);
      }
      ta.addEventListener("input", atualizarContador);
      atualizarContador();

      var erro = document.createElement("p");
      erro.className = "field-error";
      erro.hidden = true;

      campo.appendChild(label);
      campo.appendChild(ta);
      campo.appendChild(contador);
      campo.appendChild(erro);
      container.appendChild(campo);
    });
  }

  // ================= TRL (título + descrição por nível) =================

  function renderTrlPicker(){
    var container = $("trl-picker");
    var hidden = $("trl");
    container.innerHTML = "";
    TRL_NIVEIS.forEach(function(n){
      var card = document.createElement("div");
      card.className = "trl-card";
      if(hidden.value === String(n.nivel)) card.classList.add("selected");
      var num = document.createElement("span");
      num.className = "trl-card-num";
      num.textContent = String(n.nivel);
      var body = document.createElement("span");
      body.className = "trl-card-body";
      var titulo = document.createElement("strong");
      titulo.textContent = n.titulo;
      var desc = document.createElement("small");
      desc.textContent = n.descricao;
      body.appendChild(titulo);
      body.appendChild(desc);
      card.appendChild(num);
      card.appendChild(body);
      card.addEventListener("click", function(){
        hidden.value = String(n.nivel);
        container.querySelectorAll(".trl-card").forEach(function(c){ c.classList.remove("selected"); });
        card.classList.add("selected");
        hidden.dispatchEvent(new Event("change", { bubbles: true }));
      });
      container.appendChild(card);
    });
  }

  // ================= wizard: navegação =================

  function computeVisibleSteps(){
    return STEPS.filter(function(s){ return s.visibleIf ? s.visibleIf() : true; });
  }

  function goToStep(stepId, opts){
    opts = opts || {};
    var visible = computeVisibleSteps();
    if(!visible.some(function(s){ return s.id === stepId; })){
      stepId = visible[0].id;
    }
    currentStepId = stepId;
    document.querySelectorAll(".wizard-step").forEach(function(sec){
      sec.hidden = sec.getAttribute("data-step") !== stepId;
    });
    renderWizardProgress();
    atualizarRodapeWizard();
    var body = document.querySelector(".wizard-body");
    if(body) body.scrollIntoView({ behavior: "smooth", block: "start" });
    if(opts.focusEl){
      setTimeout(function(){ opts.focusEl.focus(); }, 60);
    }
  }

  function atualizarRodapeWizard(){
    var visible = computeVisibleSteps();
    var idx = visible.findIndex(function(s){ return s.id === currentStepId; });
    var isFirst = idx === 0;
    var isLast = idx === visible.length - 1;
    $("wizard-voltar").textContent = isFirst ? "Cancelar" : "Voltar";
    $("wizard-proximo").hidden = isLast;
  }

  function contarPendenciasPorStep(pending){
    var counts = {};
    pending.forEach(function(p){ counts[p.step] = (counts[p.step] || 0) + 1; });
    return counts;
  }

  function renderWizardProgress(pending){
    pending = pending || ultimoPending;
    var counts = contarPendenciasPorStep(pending);
    var visible = computeVisibleSteps();
    var idxAtual = visible.findIndex(function(s){ return s.id === currentStepId; });
    var nav = $("wizard-progress");
    nav.innerHTML = "";
    visible.forEach(function(step, i){
      var wrap = document.createElement("div");
      wrap.className = "wizard-dot-wrap";
      if(i === idxAtual) wrap.classList.add("active");
      if(i < idxAtual) wrap.classList.add("done");
      wrap.addEventListener("click", function(){ goToStep(step.id); });

      var connector = document.createElement("div");
      connector.className = "wizard-dot-connector";
      wrap.appendChild(connector);

      var dot = document.createElement("div");
      dot.className = "wizard-dot";
      dot.textContent = String(i + 1);
      wrap.appendChild(dot);

      var n = counts[step.id] || 0;
      if(n > 0){
        var badge = document.createElement("span");
        badge.className = "wizard-dot-badge";
        badge.textContent = String(n);
        wrap.appendChild(badge);
      }

      var label = document.createElement("div");
      label.className = "wizard-dot-label";
      label.textContent = step.titulo;
      wrap.appendChild(label);

      nav.appendChild(wrap);
    });
  }

  // ================= validação =================

  function cpfValido(cpf){
    var d = (cpf || "").replace(/\D/g, "");
    if(d.length !== 11) return false;
    if(/^(\d)\1{10}$/.test(d)) return false;
    function dv(tamanho){
      var soma = 0;
      for(var i = 0; i < tamanho; i++){ soma += parseInt(d[i], 10) * ((tamanho + 1) - i); }
      var resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    }
    return dv(9) === parseInt(d[9], 10) && dv(10) === parseInt(d[10], 10);
  }

  function cnpjValido(cnpj){
    var d = (cnpj || "").replace(/\D/g, "");
    if(d.length !== 14) return false;
    if(/^(\d)\1{13}$/.test(d)) return false;
    function dv(tamanho){
      var pesos = tamanho === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
      var soma = 0;
      for(var i = 0; i < tamanho; i++){ soma += parseInt(d[i], 10) * pesos[i]; }
      var resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    }
    return dv(12) === parseInt(d[12], 10) && dv(13) === parseInt(d[13], 10);
  }

  function validateIdentificacao(payload){
    var out = [];
    var sw = payload.software;
    if(sw.titulo.length < 3) out.push({ step: "identificacao", el: $("titulo"), message: "Título precisa de pelo menos 3 caracteres" });
    if(sw.descricao_curta.length < 120) out.push({ step: "identificacao", el: $("descricao_curta"), message: "Descrição do software precisa de pelo menos 120 caracteres — escreva um parágrafo, não só uma frase" });
    if(!sw.trl) out.push({ step: "identificacao", el: $("trl"), message: "Selecione o TRL" });
    if(!sw.origem.tipo) out.push({ step: "identificacao", el: $("origem_tipo"), message: "Selecione a origem do software" });
    if(!sw.data_criacao) out.push({ step: "identificacao", el: $("data_criacao"), message: "Informe a data de criação" });
    if(sw.data_criacao && sw.data_publicacao && sw.data_publicacao <= sw.data_criacao){
      out.push({ step: "identificacao", el: $("data_publicacao"), message: "Data de publicação precisa ser posterior à data de criação" });
    }
    return out;
  }

  function validateMaturidade(payload){
    var out = [];
    var m = payload.maturidade;
    if(!m) return out;
    if(trlExigeMaturidade() && m.justificativa.length < MIN_CARACTERES_PARAGRAFO){
      out.push({ step: "maturidade", el: $("trl_justificativa"), message: "Justificativa do TRL precisa de pelo menos " + MIN_CARACTERES_PARAGRAFO + " caracteres" });
    }
    if(m.empresa_interessada){
      var tipos = m.empresa_interessada.tipos_de_interesse;
      if(tipos.length === 0){
        out.push({ step: "maturidade", el: document.querySelector("#interesse-tipos input"), message: "Marque ao menos um tipo de interesse da empresa ou instituição" });
      }
      if(tipos.indexOf("parceria_em_andamento") !== -1 && !m.empresa_interessada.projeto_parceria){
        out.push({ step: "maturidade", el: $("interesse_parceria_projeto"), message: "Informe o projeto, convênio ou edital da parceria em andamento" });
      }
      if(tipos.indexOf("outro") !== -1 && !m.empresa_interessada.outro_descricao){
        out.push({ step: "maturidade", el: $("interesse_outro_descricao"), message: "Descreva o outro tipo de interesse" });
      }
      if(!m.empresa_interessada.razao_social){
        out.push({ step: "maturidade", el: $("interessada_razao_social"), message: "Informe a razão social da empresa ou instituição interessada" });
      }
      if(!cnpjValido(m.empresa_interessada.cnpj)){
        out.push({ step: "maturidade", el: $("interessada_cnpj"), message: "CNPJ da empresa ou instituição interessada ausente ou inválido" });
      }
      if(!m.carta_interesse_sera_anexada){
        out.push({ step: "maturidade", el: $("decl_carta_interesse"), message: "Confirme que a carta de manifestação de interesse será anexada ao processo" });
      }
    }
    return out;
  }

  function validateInstituicoes(payload){
    var out = [];
    var container = $("instituicoes-list");
    payload.instituicoes_parceiras.forEach(function(inst, i){
      var card = container.children[i];
      function campo(nome){ return card && card.querySelector('[data-campo="' + nome + '"]'); }
      var rotulo = "Instituição parceira " + (i + 1) + (inst.razao_social ? " (" + inst.razao_social + ")" : "");
      if(!inst.razao_social || inst.razao_social.length < 3){
        out.push({ step: "instituicoes", el: campo("razao_social"), message: rotulo + ": razão social precisa de pelo menos 3 caracteres" });
      }
      if(!cnpjValido(inst.cnpj)){
        out.push({ step: "instituicoes", el: campo("cnpj"), message: rotulo + ": CNPJ ausente ou inválido" });
      }
      if(!inst.endereco){
        out.push({ step: "instituicoes", el: campo("endereco"), message: rotulo + ": endereço obrigatório" });
      }
    });
    return out;
  }

  function validateAutores(payload){
    var out = [];
    var container = $("autores-list");
    if(payload.autores.length < 1){
      out.push({ step: "autores", el: null, message: "Adicione ao menos um autor" });
    }
    var haServidor = state.autores.some(function(r){ return r.instituicao_tipo === "propria" && r.tipo_vinculo === "servidor"; });
    payload.autores.forEach(function(a, i){
      var raw = state.autores[i];
      var card = container.children[i];
      function campo(nome){ return card && card.querySelector('[data-campo="' + nome + '"]'); }
      var rotulo = "Autor " + (i + 1) + (a.nome ? " (" + a.nome + ")" : "");

      if(!a.nome || a.nome.length < 3) out.push({ step: "autores", el: campo("nome"), message: rotulo + ": nome precisa de pelo menos 3 caracteres" });
      if(!a.nacionalidade) out.push({ step: "autores", el: campo("nacionalidade"), message: rotulo + ": informe a nacionalidade" });
      if(!cpfValido(a.cpf)) out.push({ step: "autores", el: campo("cpf"), message: rotulo + ": CPF ausente ou inválido" });

      if(!raw.instituicao_tipo){
        out.push({ step: "autores", el: campo("instituicao_tipo"), message: rotulo + ": selecione a instituição" });
      } else if(raw.instituicao_tipo === "propria"){
        if(!raw.campus) out.push({ step: "autores", el: campo("campus"), message: rotulo + ": selecione o campus" });
        if(!raw.tipo_vinculo) out.push({ step: "autores", el: campo("tipo_vinculo"), message: rotulo + ": selecione o tipo de vínculo" });
        if(raw.tipo_vinculo === "temporario" && !raw.email_alternativo){
          out.push({ step: "autores", el: campo("email_alternativo"), message: rotulo + ": e-mail alternativo obrigatório para vínculo temporário" });
        }
        if((raw.tipo_vinculo === "servidor" || raw.tipo_vinculo === "temporario") && a.email &&
           a.email.toLowerCase().split("@")[1] !== EMAIL_DOMINIO_INSTITUCIONAL){
          out.push({ step: "autores", el: campo("email"), message: rotulo + ": e-mail principal precisa ser institucional (@" + EMAIL_DOMINIO_INSTITUCIONAL + ") para vínculo servidor ou temporário" });
        }
      } else if(raw.instituicao_tipo === "parceira"){
        if(raw.instituicao_parceira_idx === "" || raw.instituicao_parceira_idx == null){
          out.push({ step: "autores", el: campo("instituicao_parceira_idx"), message: rotulo + ": selecione a instituição parceira" });
        }
      } else if(raw.instituicao_tipo === "independente"){
        if(!raw.endereco_independente) out.push({ step: "autores", el: campo("endereco_independente"), message: rotulo + ": endereço obrigatório para inventor independente" });
      }

      if(i === 0 && raw.instituicao_tipo){
        if(raw.instituicao_tipo !== "propria"){
          out.push({ step: "autores", el: campo("instituicao_tipo"), message: "O autor correspondente precisa ter vínculo com a " + INSTITUICAO.sigla });
        } else if(haServidor && raw.tipo_vinculo && raw.tipo_vinculo !== "servidor"){
          out.push({ step: "autores", el: campo("tipo_vinculo"), message: "Há servidor entre os autores — o autor correspondente precisa ser o servidor" });
        }
      }

      if(!a.email) out.push({ step: "autores", el: campo("email"), message: rotulo + ": e-mail obrigatório" });
      if(!a.qualificacao_profissional) out.push({ step: "autores", el: campo("qualificacao_profissional"), message: rotulo + ": informe a qualificação profissional" });

      // Quem não é da instituição própria precisa de um telefone para a CIE conseguir o contato.
      if(raw.instituicao_tipo && raw.instituicao_tipo !== "propria" && (a.telefone || "").replace(/\D/g, "").length < 8){
        out.push({ step: "autores", el: campo("telefone"), message: rotulo + ": telefone de contato obrigatório para quem não é da " + INSTITUICAO.sigla + " (com DDD)" });
      }
    });
    return out;
  }

  function validateClassificacao(payload){
    var out = [];
    if(payload.software.linguagens.length < 1) out.push({ step: "classificacao", el: $("linguagens-custom"), message: "Selecione ao menos uma linguagem" });
    if(payload.software.area_aplicacao.length < 1) out.push({ step: "classificacao", el: $("area-search"), message: "Selecione ao menos uma área de aplicação" });
    if(payload.software.tipo_programa.length < 1) out.push({ step: "classificacao", el: $("tipo-search"), message: "Selecione ao menos um tipo de programa" });
    if(payload.software.palavras_chave.length < MIN_PALAVRAS_CHAVE){
      out.push({ step: "classificacao", el: $("palavras-custom"), message: "Adicione ao menos " + MIN_PALAVRAS_CHAVE + " palavras-chave" });
    } else if(payload.software.palavras_chave.length > MAX_PALAVRAS_CHAVE){
      out.push({ step: "classificacao", el: $("palavras-custom"), message: "No máximo " + MAX_PALAVRAS_CHAVE + " palavras-chave (estão " + payload.software.palavras_chave.length + ")" });
    }
    return out;
  }

  function validateParceria(payload){
    var out = [];
    if(!payload.parceria) return out;
    cotitularesParceiras(payload.parceria.cotitularidade).forEach(function(c, i){
      if(c.justificativa.length < MIN_CARACTERES_PARAGRAFO){
        out.push({ step: "parceria", el: document.querySelector('[data-just-idx="' + i + '"]'),
          message: (c.instituicao || "Instituição parceira " + (i + 1)) + ": descreva a contribuição em pelo menos " + MIN_CARACTERES_PARAGRAFO + " caracteres" });
      }
    });
    var cot = payload.parceria.cotitularidade;
    var incompleto = cot.some(function(c){ return c.percentual === "" || isNaN(c.percentual); });
    if(incompleto){
      out.push({ step: "parceria", el: $("cotitularidade-propria"), message: "Preencha o percentual de cotitularidade de todas as instituições (inclusive " + INSTITUICAO.sigla + ")" });
    } else {
      var soma = cot.reduce(function(acc, c){ return acc + c.percentual; }, 0);
      if(Math.abs(soma - 100) > 0.5){
        out.push({ step: "parceria", el: $("cotitularidade-propria"), message: "A soma dos percentuais de cotitularidade precisa ser 100 (está em " + soma + ")" });
      }
    }
    return out;
  }

  function validateRelease(payload){
    var out = [];
    if(!payload.release.tag) out.push({ step: "artefato", el: $("release-tag"), message: "Informe o nome da release" });
    if(!/^[0-9a-f]{128}$/.test(payload.release.sha512)) out.push({ step: "artefato", el: $("release-sha512"), message: "SHA-512 precisa ter 128 caracteres hexadecimais" });
    if(!$("release-repo-sufixo").value.trim()) out.push({ step: "artefato", el: $("release-repo-sufixo"), message: "Informe o nome do repositório no GitHub" });
    return out;
  }

  function validateDeclaracoes(payload){
    var out = [];
    var d = payload.declaracoes;
    if(!d.responsabilidade_acompanhamento) out.push({ step: "declaracoes", el: $("decl_acompanhamento"), message: "Confirme a declaração de responsabilidade pelo acompanhamento do processo" });
    if(!d.responsabilidade_busca_anterioridade) out.push({ step: "declaracoes", el: $("decl_busca_anterioridade"), message: "Confirme a declaração sobre a Busca de Anterioridade" });
    if(!d.ciencia_custos_inpi) out.push({ step: "declaracoes", el: $("decl_custos_inpi"), message: "Confirme a ciência dos custos do INPI" });
    if(!d.guarda_hash_50_anos) out.push({ step: "declaracoes", el: $("decl_guarda_hash"), message: "Confirme a declaração de guarda do arquivo pelo prazo de 50 anos" });
    if(!payload.comercializacao.compromisso_informar_cie) out.push({ step: "declaracoes", el: $("comercializacao_compromisso"), message: "Confirme o compromisso de informar a CIE e os demais autores sobre negociação de licenciamento" });
    if(!d.guarda_copia_autores) out.push({ step: "declaracoes", el: $("decl_guarda_copia"), message: "Confirme a declaração de guarda de cópia do software pelos autores" });
    if(payload.derivacao.autorizada && !d.guarda_autorizacao_derivacao){
      out.push({ step: "declaracoes", el: $("decl_guarda_derivacao"), message: "Confirme a declaração de guarda da autorização de derivação" });
    }
    if(!d.veracidade_informacoes) out.push({ step: "declaracoes", el: $("decl_veracidade"), message: "Confirme a declaração de veracidade das informações" });
    return out;
  }

  function validateAll(payload){
    var out = [];
    out = out.concat(validateIdentificacao(payload));
    out = out.concat(validateMaturidade(payload));
    out = out.concat(validateInstituicoes(payload));
    out = out.concat(validateAutores(payload));
    out = out.concat(validateClassificacao(payload));
    if(state.instituicoes_parceiras.length > 0){
      out = out.concat(validateParceria(payload));
    }
    out = out.concat(validateRelease(payload));
    out = out.concat(validateDeclaracoes(payload));
    return out;
  }

  // ================= payload =================

  function buildPayload(){
    var autoresValidos = state.autores.map(function(a){
      var instNome = INSTITUICAO.sigla;
      var endereco = "";
      if(a.instituicao_tipo === "parceira"){
        var inst = state.instituicoes_parceiras[a.instituicao_parceira_idx];
        instNome = inst ? (inst.razao_social || "") : "";
        endereco = inst ? (inst.endereco || "") : "";
      } else if(a.instituicao_tipo === "independente"){
        instNome = "Inventor independente";
        endereco = (a.endereco_independente || "").trim();
      }
      return {
        nome: (a.nome || "").trim(),
        nacionalidade: (a.nacionalidade || "").trim(),
        cpf: (a.cpf || "").trim(),
        instituicao_tipo: a.instituicao_tipo || "",
        instituicao_nome: instNome,
        campus: a.instituicao_tipo === "propria" ? (a.campus || "") : "",
        // "parceiro" já vem forçado em state por atualizarVisibilidadeAutor
        // quando instituicao_tipo é "parceira" — não é uma escolha do docente.
        tipo_vinculo: (a.instituicao_tipo === "propria" || a.instituicao_tipo === "parceira") ? (a.tipo_vinculo || "") : "",
        endereco: endereco,
        telefone: (a.telefone || "").trim(),
        email: (a.email || "").trim(),
        email_alternativo: (a.email_alternativo || "").trim(),
        qualificacao_profissional: (a.qualificacao_profissional || "").trim(),
        inventor_externo: !!a.instituicao_tipo && a.instituicao_tipo !== "propria"
      };
    });

    var instituicoesValidas = state.instituicoes_parceiras.map(function(inst){
      return {
        razao_social: (inst.razao_social || "").trim(),
        cnpj: (inst.cnpj || "").trim(),
        endereco: (inst.endereco || "").trim()
      };
    });

    var possuiColaboradorExterno = state.autores.some(function(a){
      return !!a.instituicao_tipo && a.instituicao_tipo !== "propria";
    });

    var trlValue = $("trl").value;
    var derivacaoRadio = document.querySelector('input[name="derivacao_autorizada"]:checked');

    var payload = {
      software: {
        titulo: $("titulo").value.trim(),
        descricao_curta: $("descricao_curta").value.trim(),
        linguagens: state.linguagens,
        area_aplicacao: state.area_aplicacao,
        tipo_programa: state.tipo_programa,
        palavras_chave: state.palavras_chave,
        trl: trlValue ? parseInt(trlValue, 10) : "",
        origem: {
          tipo: $("origem_tipo").value,
          vinculo: $("origem_vinculo").value.trim()
        },
        data_criacao: $("data_criacao").value,
        data_publicacao: $("data_publicacao").value,
        informe_projeto: $("informe_projeto").value.trim(),
        possui_colaborador_externo: possuiColaboradorExterno,
        possui_empresa_interessada: temEmpresaInteressada()
      },
      instituicoes_parceiras: instituicoesValidas,
      autores: autoresValidos,
      derivacao: {
        autorizada: !!derivacaoRadio && derivacaoRadio.value === "sim",
        titulo_original: $("derivacao_titulo_original").value.trim(),
        linguagem_original: $("derivacao_linguagem_original").value.trim(),
        numero_registro_inpi_original: $("derivacao_numero_registro").value.trim()
      },
      comercializacao: {
        compromisso_informar_cie: $("comercializacao_compromisso").checked
      },
      declaracoes: {
        responsabilidade_acompanhamento: $("decl_acompanhamento").checked,
        responsabilidade_busca_anterioridade: $("decl_busca_anterioridade").checked,
        ciencia_custos_inpi: $("decl_custos_inpi").checked,
        guarda_hash_50_anos: $("decl_guarda_hash").checked,
        guarda_copia_autores: $("decl_guarda_copia").checked,
        guarda_autorizacao_derivacao: $("decl_guarda_derivacao").checked,
        veracidade_informacoes: $("decl_veracidade").checked
      },
      release: {
        tag: $("release-tag").value.trim(),
        sha512: $("release-sha512").value.trim().toLowerCase(),
        repositorio: GITHUB_ORG + "/" + $("release-repo-sufixo").value.trim()
      },
      gerado_em: new Date().toISOString().slice(0, 10),
      versao_fluxo: VERSAO_FLUXO
    };

    if(instituicoesValidas.length > 0){
      var propriaInput = $("cotitularidade-propria");
      var cotitularidade = [{
        instituicao_tipo: "propria",
        instituicao: INSTITUICAO.sigla,
        percentual: propriaInput.value === "" ? "" : parseFloat(propriaInput.value)
      }];
      document.querySelectorAll("#cotitularidade-parceiras-list [data-idx]").forEach(function(inp){
        var idx = parseInt(inp.getAttribute("data-idx"), 10);
        var inst = instituicoesValidas[idx];
        var just = document.querySelector('[data-just-idx="' + idx + '"]');
        cotitularidade.push({
          instituicao_tipo: "parceira",
          instituicao: inst ? inst.razao_social : "",
          percentual: inp.value === "" ? "" : parseFloat(inp.value),
          justificativa: just ? just.value.trim() : ""
        });
      });
      payload.parceria = { cotitularidade: cotitularidade };
    }

    if(trlExigeMaturidade() || temEmpresaInteressada()){
      payload.maturidade = {
        justificativa: trlExigeMaturidade() ? $("trl_justificativa").value.trim() : "",
        empresa_interessada: temEmpresaInteressada() ? {
          razao_social: $("interessada_razao_social").value.trim(),
          cnpj: $("interessada_cnpj").value.trim(),
          // Valores de INTERESSE_TIPOS. A extensão do NIT os leva ao Notion como
          // seleção múltipla; os dois textos só valem quando a opção está marcada.
          tipos_de_interesse: tiposDeInteresse(),
          projeto_parceria: tiposDeInteresse().indexOf("parceria_em_andamento") !== -1 ? $("interesse_parceria_projeto").value.trim() : "",
          outro_descricao: tiposDeInteresse().indexOf("outro") !== -1 ? $("interesse_outro_descricao").value.trim() : ""
        } : null,
        carta_interesse_sera_anexada: temEmpresaInteressada() ? $("decl_carta_interesse").checked : false
      };
    }

    return payload;
  }

  // ================= erros por campo + revisão =================

  var ultimoPending = [];

  function limparErrosInline(){
    document.querySelectorAll(".field.invalid, .decl-card.invalid").forEach(function(f){ f.classList.remove("invalid"); });
    document.querySelectorAll("input.invalid, select.invalid, textarea.invalid").forEach(function(f){ f.classList.remove("invalid"); });
    document.querySelectorAll(".field-error").forEach(function(f){ f.hidden = true; f.textContent = ""; });
  }

  function ehCampoDeCotitularidade(el){
    return !!el && (el.id === "cotitularidade-propria" || el.hasAttribute("data-idx"));
  }

  function renderInlineErrors(pending){
    limparErrosInline();
    var pendCotitularidade = [];
    pending.forEach(function(p){
      if(p.step === "parceria" && ehCampoDeCotitularidade(p.el)){
        pendCotitularidade.push(p);
        return;
      }
      if(!p.el) return;
      var mostrar = touchedEls.has(p.el) || stepsTouched[p.step];
      if(!mostrar) return;
      var fieldWrap = p.el.closest(".field") || p.el.closest(".decl-card");
      if(!fieldWrap) return;
      fieldWrap.classList.add("invalid");
      var errEl = fieldWrap.querySelector(".field-error");
      if(errEl && errEl.hidden){
        errEl.hidden = false;
        errEl.textContent = p.message;
      }
    });
    renderErroCotitularidade(pendCotitularidade);
  }

  // O erro de cotitularidade fica no título da seção, não debaixo de cada
  // caixinha de percentual — só os campos vazios ficam marcados em vermelho.
  function renderErroCotitularidade(pendParceria){
    var erroEl = $("cotitularidade-erro");
    if(!erroEl) return;
    var propriaInput = $("cotitularidade-propria");
    var parceirasInputs = document.querySelectorAll("#cotitularidade-parceiras-list [data-idx]");
    propriaInput.classList.remove("invalid");
    parceirasInputs.forEach(function(inp){ inp.classList.remove("invalid"); });
    if(pendParceria.length === 0){
      erroEl.hidden = true;
      erroEl.textContent = "";
      return;
    }
    var tocado = touchedEls.has(propriaInput) || stepsTouched.parceria;
    if(!tocado){
      parceirasInputs.forEach(function(inp){ if(touchedEls.has(inp)) tocado = true; });
    }
    if(!tocado) return;
    erroEl.hidden = false;
    erroEl.textContent = pendParceria[0].message;
    if(propriaInput.value === "") propriaInput.classList.add("invalid");
    parceirasInputs.forEach(function(inp){ if(inp.value === "") inp.classList.add("invalid"); });
  }

  function renderRevisao(pending){
    var box = $("revisao-pendencias");
    if(pending.length === 0){
      box.className = "validation-box ok";
      box.innerHTML = "<strong>Pronto para gerar o PDF.</strong> Ainda assim, revise os dados antes de anexar ao processo no SIPAC.";
      $("btn-gerar-pdf").disabled = false;
      return;
    }
    box.className = "validation-box pending";
    var porStep = {};
    var ordem = [];
    pending.forEach(function(p){
      if(!porStep[p.step]){ porStep[p.step] = []; ordem.push(p.step); }
      porStep[p.step].push(p);
    });
    var html = "<strong>" + pending.length + " item(ns) pendente(s):</strong>";
    ordem.forEach(function(stepId){
      var stepMeta = STEPS.filter(function(s){ return s.id === stepId; })[0];
      html += "<h4>" + escapeHtml(stepMeta ? stepMeta.titulo : stepId) + "</h4><ul>";
      porStep[stepId].forEach(function(p, i){
        html += '<li><button type="button" data-jump-step="' + stepId + '" data-jump-index="' + i + '">' + escapeHtml(p.message) + "</button></li>";
      });
      html += "</ul>";
    });
    box.innerHTML = html;
    box.querySelectorAll("[data-jump-step]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var stepId = btn.getAttribute("data-jump-step");
        var idx = parseInt(btn.getAttribute("data-jump-index"), 10);
        var item = porStep[stepId][idx];
        stepsTouched[stepId] = true;
        goToStep(stepId, { focusEl: item.el || undefined });
        renderTudo();
      });
    });
    $("btn-gerar-pdf").disabled = true;
  }

  function renderTudo(){
    atualizarBlocosMaturidade();
    var payload = buildPayload();
    var pending = validateAll(payload);
    ultimoPending = pending;
    renderWizardProgress(pending);
    renderInlineErrors(pending);
    renderRevisao(pending);
    return payload;
  }

  // ================= geração do PDF (pdf-lib, vendorizado, zero rede) =================

  function dividirEmLinhas(texto, tamanho){
    var linhas = [];
    for(var i = 0; i < texto.length; i += tamanho){
      linhas.push(texto.slice(i, i + tamanho));
    }
    return linhas;
  }

  function sha256Hex(texto){
    var bytes = new TextEncoder().encode(texto);
    return crypto.subtle.digest("SHA-256", bytes).then(function(buffer){
      return Array.prototype.map.call(new Uint8Array(buffer), function(b){
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  function nomeArquivoPdf(payload){
    var base = normalize(payload.software.titulo || "software")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "software";
    return "submissao-" + base + "-sipac.pdf";
  }

  function baixarArquivo(dados, nome, tipo){
    var blob = new Blob([dados], { type: tipo });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  function mostrarStatusPdf(texto, tipo){
    var el = $("pdf-status");
    el.textContent = texto;
    el.className = "pdf-status show " + tipo;
  }

  function mostrarFeedbackRascunho(texto, tipo){
    var el = $("draft-feedback");
    if(!el) return;
    el.textContent = texto;
    el.className = "draft-feedback " + tipo;
  }

  // ---- texto que a fonte do PDF não consegue imprimir ----
  //
  // As fontes padrão do PDF (Helvetica, Courier) só aceitam o conjunto WinAnsi
  // (o Latin-1 do Windows). Um caractere fora dele, como "ṕ" de uma tecla morta
  // mal usada, "ś"/"ł" de um nome estrangeiro, "→" ou um emoji, fazia o pdf-lib
  // lançar "WinAnsi cannot encode" e a geração inteira falhava. O texto IMPRESSO
  // é simplificado (letra-base, espaço ou "?") e a pessoa é avisada; os dados de
  // verdade (anexo e bloco de texto) seguem intactos, com escapes \uXXXX.
  var substituicoesPdf = [];

  function anotarSubstituicao(original, trocado){
    var par = original + " → " + trocado;
    if(substituicoesPdf.indexOf(par) === -1) substituicoesPdf.push(par);
  }

  function simplificarParaPdf(texto, suportados){
    var saida = "";
    Array.from(String(texto)).forEach(function(c){
      if(suportados.has(c.codePointAt(0))){ saida += c; return; }
      var base = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if(base !== c && base.length && Array.from(base).every(function(b){ return suportados.has(b.codePointAt(0)); })){
        anotarSubstituicao(c, base);
        saida += base;
        return;
      }
      if(c.codePointAt(0) < 0x20 || c.codePointAt(0) === 0x7f || /\s/.test(c)){ saida += " "; return; }
      anotarSubstituicao(c, "?");
      saida += "?";
    });
    return saida;
  }

  function protegerFonte(fonte){
    var suportados = new Set(fonte.getCharacterSet());
    var codificar = fonte.encodeText.bind(fonte);
    var medir = fonte.widthOfTextAtSize.bind(fonte);
    fonte.encodeText = function(texto){ return codificar(simplificarParaPdf(texto, suportados)); };
    fonte.widthOfTextAtSize = function(texto, tamanho){ return medir(simplificarParaPdf(texto, suportados), tamanho); };
    return fonte;
  }

  function gerarPdf(payload){
    substituicoesPdf = [];
    var PDFLib = window.PDFLib;
    var LARGURA = 595.28, ALTURA = 841.89, MARGEM = 50;
    var LARGURA_UTIL = LARGURA - 2 * MARGEM;
    var COL_LABEL = 150;

    var COR_TINTA = PDFLib.rgb(0.137, 0.149, 0.122);
    var COR_TINTA_SUAVE = PDFLib.rgb(0.337, 0.353, 0.306);
    var COR_TINTA_FRACA = PDFLib.rgb(0.541, 0.553, 0.502);
    var COR_LINHA = PDFLib.rgb(0.847, 0.839, 0.784);
    var COR_ACCENT = PDFLib.rgb(0, 0.2196, 0.4118); // #003869
    var COR_ACCENT_SUAVE = PDFLib.rgb(0.890, 0.925, 0.961); // azul bem claro, para os cartões
    var COR_BRANCO = PDFLib.rgb(1, 1, 1);

    return PDFLib.PDFDocument.create().then(function(pdfDoc){
      return Promise.all([
        pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
        pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold),
        pdfDoc.embedFont(PDFLib.StandardFonts.Courier)
      ]).then(function(fontes){
        var fonte = protegerFonte(fontes[0]), fonteNegrito = protegerFonte(fontes[1]), fonteMono = protegerFonte(fontes[2]);

        pdfDoc.setTitle("Comunicado de Invenção — " + (payload.software.titulo || "sem título"));
        pdfDoc.setAuthor(INSTITUICAO.sigla + " — Coordenação de Inovação e Empreendedorismo");
        pdfDoc.setSubject("Comunicado de Invenção de software — dados para instrução do processo no SIPAC");
        pdfDoc.setKeywords(["NIT", INSTITUICAO.sigla, "SIPAC", "software"].concat(payload.software.palavras_chave || []));
        pdfDoc.setProducer("Gerador de PDF do SIPAC — " + INSTITUICAO.sigla);
        pdfDoc.setCreationDate(new Date());

        var fluxo = { pagina: null, y: 0, primeiraPagina: true };

        function desenharCabecalho(){
          var pg = fluxo.pagina;
          pg.drawRectangle({ x: 0, y: ALTURA - 6, width: LARGURA, height: 6, color: COR_ACCENT });
          var topo = fluxo.y + 10;
          var baixo = topo - 66;
          pg.drawRectangle({ x: MARGEM, y: baixo, width: 3.5, height: topo - baixo, color: COR_ACCENT });
          var xTexto = MARGEM + 14;
          fluxo.y -= 4;
          pg.drawText(nomeESiglaInstituicao(), {
            x: xTexto, y: fluxo.y, size: 10.5, font: fonteNegrito, color: COR_TINTA
          });
          fluxo.y -= 14;
          pg.drawText("Coordenação de Inovação e Empreendedorismo", {
            x: xTexto, y: fluxo.y, size: 9.5, font: fonte, color: COR_TINTA_SUAVE
          });
          fluxo.y -= 28;
          pg.drawText("Comunicado de Invenção", { x: xTexto, y: fluxo.y, size: 21, font: fonteNegrito, color: COR_ACCENT });
          var dataTexto = "Gerado em " + dataBr(payload.gerado_em);
          var largDataTexto = fonte.widthOfTextAtSize(dataTexto, 8.5);
          pg.drawText(dataTexto, {
            x: LARGURA - MARGEM - largDataTexto, y: fluxo.y + 2, size: 8.5, font: fonte, color: COR_TINTA_FRACA
          });
          fluxo.y = baixo - 22;
        }

        function novaPagina(){
          fluxo.pagina = pdfDoc.addPage([LARGURA, ALTURA]);
          fluxo.y = ALTURA - MARGEM;
          if(fluxo.primeiraPagina){
            desenharCabecalho();
            fluxo.primeiraPagina = false;
          } else {
            fluxo.y -= 4;
          }
        }
        novaPagina();

        function garantirEspaco(altura){
          if(fluxo.y - altura < MARGEM){ novaPagina(); }
        }

        function quebrarTexto(texto, tamanho, fonteUsada, largura){
          largura = largura || LARGURA_UTIL;
          var palavras = String(texto == null ? "" : texto).split(" ");
          var linhas = [];
          var atual = "";
          palavras.forEach(function(palavra){
            // Palavra sem espaço mais larga que a coluna (ex.: hash de 128 hex): quebra por caractere.
            while(fonteUsada.widthOfTextAtSize(palavra, tamanho) > largura && palavra.length > 1){
              var corte = palavra.length - 1;
              while(corte > 1 && fonteUsada.widthOfTextAtSize(palavra.slice(0, corte), tamanho) > largura) corte--;
              if(atual){ linhas.push(atual); atual = ""; }
              linhas.push(palavra.slice(0, corte));
              palavra = palavra.slice(corte);
            }
            var teste = atual ? atual + " " + palavra : palavra;
            if(fonteUsada.widthOfTextAtSize(teste, tamanho) > largura && atual){
              linhas.push(atual);
              atual = palavra;
            } else {
              atual = teste;
            }
          });
          if(atual) linhas.push(atual);
          return linhas.length ? linhas : [""];
        }

        function tituloSecao(texto, minimoApos){
          // Título nunca fica sozinho no fim da página: exige espaço para o título e as primeiras linhas.
          garantirEspaco(minimoApos || 70);
          fluxo.y -= 12;
          fluxo.pagina.drawRectangle({ x: MARGEM, y: fluxo.y - 1.5, width: 3, height: 13, color: COR_ACCENT });
          fluxo.pagina.drawText(texto, { x: MARGEM + 9, y: fluxo.y, size: 12.5, font: fonteNegrito, color: COR_ACCENT });
          fluxo.y -= 8;
          fluxo.pagina.drawLine({ start: { x: MARGEM, y: fluxo.y }, end: { x: LARGURA - MARGEM, y: fluxo.y }, thickness: 0.75, color: COR_LINHA });
          fluxo.y -= 18;
        }

        function cabecalhoEntidade(texto){
          garantirEspaco(70);
          fluxo.y -= 8;
          var largura = Math.min(fonteNegrito.widthOfTextAtSize(texto, 10.5) + 16, LARGURA_UTIL);
          fluxo.pagina.drawRectangle({ x: MARGEM, y: fluxo.y - 4, width: largura, height: 17, color: COR_ACCENT_SUAVE });
          fluxo.pagina.drawText(texto, { x: MARGEM + 8, y: fluxo.y, size: 10.5, font: fonteNegrito, color: COR_ACCENT });
          fluxo.y -= 22;
        }

        function linhaCampo(rotulo, valor, opcoes){
          opcoes = opcoes || {};
          var tamanho = opcoes.tamanho || 9.5;
          var indent = opcoes.indent || 0;
          var largValor = LARGURA_UTIL - COL_LABEL - indent;
          var textoValor = (valor == null || valor === "") ? "—" : String(valor);
          var fonteValor = opcoes.mono ? fonteMono : fonte;
          // "quebra" corta em blocos fixos (hash); sem ela, quebra por palavra.
          var linhasValor = opcoes.quebra ? dividirEmLinhas(textoValor, opcoes.quebra) : quebrarTexto(textoValor, tamanho, fonteValor, largValor);
          var lineHeight = tamanho + 3.5;
          // Rótulo longo quebra dentro da coluna dele em vez de invadir a do valor.
          var linhasRotulo = quebrarTexto(rotulo, tamanho, fonteNegrito, COL_LABEL - 12);
          var total = Math.max(linhasValor.length, linhasRotulo.length);
          garantirEspaco(total * lineHeight + 8);
          for(var k = 0; k < total; k++){
            if(k < linhasRotulo.length){
              fluxo.pagina.drawText(linhasRotulo[k], { x: MARGEM + indent, y: fluxo.y, size: tamanho, font: fonteNegrito, color: COR_TINTA_SUAVE });
            }
            if(k < linhasValor.length){
              fluxo.pagina.drawText(linhasValor[k], { x: MARGEM + indent + COL_LABEL, y: fluxo.y, size: tamanho, font: fonteValor, color: COR_TINTA });
            }
            fluxo.y -= lineHeight;
          }
          fluxo.y -= 5;
        }

        function paragrafoBloco(rotulo, texto, opcoes){
          opcoes = opcoes || {};
          var tamanho = opcoes.tamanho || 9.5;
          garantirEspaco(3 * (tamanho + 3) + tamanho + 10);
          fluxo.y -= 3;
          fluxo.pagina.drawText(rotulo, { x: MARGEM, y: fluxo.y, size: tamanho, font: fonteNegrito, color: COR_TINTA_SUAVE });
          fluxo.y -= (tamanho + 5);
          var linhas = quebrarTexto(texto || "—", tamanho, fonte, LARGURA_UTIL);
          linhas.forEach(function(l){
            garantirEspaco(tamanho + 3);
            fluxo.pagina.drawText(l, { x: MARGEM, y: fluxo.y, size: tamanho, font: fonte, color: COR_TINTA });
            fluxo.y -= (tamanho + 3.5);
          });
          fluxo.y -= 9;
        }

        function paragrafoSimples(texto, tamanho){
          tamanho = tamanho || 9;
          var linhas = quebrarTexto(texto, tamanho, fonte, LARGURA_UTIL);
          linhas.forEach(function(l){
            garantirEspaco(tamanho + 3);
            fluxo.pagina.drawText(l, { x: MARGEM, y: fluxo.y, size: tamanho, font: fonte, color: COR_TINTA_SUAVE });
            fluxo.y -= (tamanho + 3);
          });
          fluxo.y -= 6;
        }

        function linhaCheckbox(texto, marcado){
          var tamanho = 9.5;
          var largura = LARGURA_UTIL - 22;
          var linhas = quebrarTexto(texto, tamanho, fonte, largura);
          var lineHeight = tamanho + 3.5;
          garantirEspaco(linhas.length * lineHeight + 8);
          var bx = MARGEM, by = fluxo.y - 2;
          fluxo.pagina.drawRectangle({ x: bx, y: by, width: 10, height: 10, borderColor: marcado ? COR_ACCENT : COR_TINTA_SUAVE, borderWidth: 0.9, color: marcado ? COR_ACCENT : COR_BRANCO });
          if(marcado){
            // Tick desenhado com dois traços, centrado na caixa (um "x" de texto ficava torto).
            var tick = { thickness: 1.5, color: COR_BRANCO, lineCap: PDFLib.LineCapStyle.Round };
            fluxo.pagina.drawLine(Object.assign({ start: { x: bx + 2.3, y: by + 5.3 }, end: { x: bx + 4.2, y: by + 3.1 } }, tick));
            fluxo.pagina.drawLine(Object.assign({ start: { x: bx + 4.2, y: by + 3.1 }, end: { x: bx + 7.9, y: by + 7.4 } }, tick));
          }
          linhas.forEach(function(l){
            fluxo.pagina.drawText(l, { x: MARGEM + 22, y: fluxo.y, size: tamanho, font: fonte, color: COR_TINTA });
            fluxo.y -= lineHeight;
          });
          fluxo.y -= 6;
        }

        function desenharRodapes(){
          var paginas = pdfDoc.getPages();
          paginas.forEach(function(pagina, i){
            pagina.drawLine({ start: { x: MARGEM, y: 34 }, end: { x: LARGURA - MARGEM, y: 34 }, thickness: 0.5, color: COR_LINHA });
            pagina.drawText(INSTITUICAO.sigla + " · Coordenação de Inovação e Empreendedorismo · Comunicado de Invenção", { x: MARGEM, y: 22, size: 7.5, font: fonte, color: COR_TINTA_FRACA });
            var texto = "Página " + (i + 1) + " de " + paginas.length;
            pagina.drawText(texto, { x: LARGURA - MARGEM - fonte.widthOfTextAtSize(texto, 7.5), y: 22, size: 7.5, font: fonte, color: COR_TINTA_FRACA });
          });
        }

        // ---- conteúdo, na mesma ordem do formulário-modelo do CIE ----

        tituloSecao("Identificação");
        linhaCampo("Título", payload.software.titulo);
        linhaCampo("Maturidade (TRL)", rotuloTrl(payload.software.trl));
        linhaCampo("Origem", rotuloOrigem(payload.software.origem.tipo));
        if(payload.software.origem.vinculo){
          linhaCampo("Projeto, disciplina ou edital", payload.software.origem.vinculo);
        }
        linhaCampo("Data de criação", dataBr(payload.software.data_criacao));
        linhaCampo("Data de publicação", dataBr(payload.software.data_publicacao));
        paragrafoBloco("Descrição do software", payload.software.descricao_curta);
        if(payload.software.informe_projeto){
          paragrafoBloco("Informações sobre o projeto de origem", payload.software.informe_projeto);
        }

        tituloSecao("Maturidade e interesse");
        if(payload.maturidade && payload.maturidade.justificativa){
          paragrafoBloco("Justificativa do " + rotuloTrl(payload.software.trl).split(" — ")[0] + " (comprovantes anexados ao processo no SIPAC)", payload.maturidade.justificativa);
        }
        if(payload.maturidade && payload.maturidade.empresa_interessada){
          linhaCampo("Empresa ou instituição interessada", payload.maturidade.empresa_interessada.razao_social);
          linhaCampo("CNPJ", payload.maturidade.empresa_interessada.cnpj);
          linhaCampo("Tipo de interesse", payload.maturidade.empresa_interessada.tipos_de_interesse.map(rotuloDoInteresse).join("; "));
          if(payload.maturidade.empresa_interessada.projeto_parceria){
            linhaCampo("Parceria em andamento (projeto, convênio ou edital)", payload.maturidade.empresa_interessada.projeto_parceria);
          }
          if(payload.maturidade.empresa_interessada.outro_descricao){
            linhaCampo("Outro interesse", payload.maturidade.empresa_interessada.outro_descricao);
          }
        } else {
          linhaCampo("Empresa ou instituição interessada", "Não informada");
        }

        if(payload.instituicoes_parceiras.length > 0){
          tituloSecao("Instituições parceiras", 130);
          payload.instituicoes_parceiras.forEach(function(inst, i){
            cabecalhoEntidade("Instituição parceira " + (i + 1) + " — " + (inst.razao_social || "—"));
            linhaCampo("CNPJ", inst.cnpj, { indent: 10 });
            linhaCampo("Endereço", inst.endereco, { indent: 10 });
          });

          if(payload.parceria){
            tituloSecao("Parceria — cotitularidade e contribuições");
            payload.parceria.cotitularidade.forEach(function(c){
              linhaCampo(c.instituicao || "—", (c.percentual === "" || c.percentual == null ? "—" : c.percentual + "%"), { indent: 10 });
            });
            cotitularesParceiras(payload.parceria.cotitularidade).forEach(function(c){
              paragrafoBloco("Contribuição de " + (c.instituicao || "—"), c.justificativa);
            });
          }
        }

        tituloSecao("Autores", 150);
        payload.autores.forEach(function(autor, i){
          cabecalhoEntidade((i === 0 ? "Autor correspondente — " : "Autor " + (i + 1) + " — ") + (autor.nome || "—"));
          linhaCampo("Nacionalidade", autor.nacionalidade, { indent: 10 });
          linhaCampo("CPF", cpfBr(autor.cpf), { indent: 10 });
          linhaCampo("Instituição", autor.instituicao_nome, { indent: 10 });
          if(autor.instituicao_tipo === "propria"){
            linhaCampo("Campus", autor.campus, { indent: 10 });
          }
          if(autor.tipo_vinculo){
            linhaCampo("Tipo de vínculo", rotuloVinculo(autor.tipo_vinculo), { indent: 10 });
          }
          if(autor.endereco){
            linhaCampo("Endereço", autor.endereco, { indent: 10 });
          }
          linhaCampo("E-mail", autor.email, { indent: 10 });
          linhaCampo("E-mail alternativo", autor.email_alternativo, { indent: 10 });
          linhaCampo("Telefone", autor.telefone, { indent: 10 });
          linhaCampo("Qualificação profissional", autor.qualificacao_profissional, { indent: 10 });
          linhaCampo("Inventor externo?", autor.inventor_externo ? "Sim" : "Não", { indent: 10 });
          fluxo.y -= 6;
        });

        tituloSecao("Classificação");
        linhaCampo("Linguagens", (payload.software.linguagens || []).join(", "));
        linhaCampo("Área de aplicação", (payload.software.area_aplicacao || []).join("; "));
        linhaCampo("Tipo de programa", (payload.software.tipo_programa || []).join("; "));
        linhaCampo("Palavras-chave", (payload.software.palavras_chave || []).join(", "));

        tituloSecao("Programa a proteger");
        linhaCampo("Repositório", payload.release.repositorio);
        linhaCampo("Release", payload.release.tag);
        linhaCampo("SHA-512", payload.release.sha512, { tamanho: 8, mono: true, quebra: 64 });

        tituloSecao("Derivação autorizada");
        linhaCampo("Derivação autorizada?", payload.derivacao.autorizada ? "Sim" : "Não");
        if(payload.derivacao.autorizada){
          linhaCampo("Programa original — título", payload.derivacao.titulo_original, { indent: 10 });
          linhaCampo("Programa original — linguagem", payload.derivacao.linguagem_original, { indent: 10 });
          linhaCampo("Programa original — nº de registro no INPI", payload.derivacao.numero_registro_inpi_original, { indent: 10 });
          linhaCheckbox("Declaro que os autores do software são responsáveis pela guarda do documento que autoriza esta derivação.", payload.declaracoes.guarda_autorizacao_derivacao);
        }

        tituloSecao("Comercialização da tecnologia");
        linhaCheckbox(
          "Me comprometo a informar a CIE e os demais autores sobre a existência de negociação que poderá resultar no licenciamento da TECNOLOGIA, no qual necessitará firmar um instrumento jurídico com as condições dessa comercialização.",
          payload.comercializacao.compromisso_informar_cie
        );

        // Sem bloco "Declarante": quem assina é o declarante, e o SIPAC lista as assinaturas logo abaixo do PDF.
        // As declarações ficam juntas numa só página.
        tituloSecao("Declarações de responsabilidade e veracidade das informações", 330);
        linhaCheckbox("Declaro que assumo inteira responsabilidade pelo acompanhamento das informações do processo de pedido de registro de programa de computador.", payload.declaracoes.responsabilidade_acompanhamento);
        linhaCheckbox("Declaro que assumo inteira responsabilidade pela realização da Busca de Anterioridade nos casos em que esta se fizer necessária.", payload.declaracoes.responsabilidade_busca_anterioridade);
        linhaCheckbox("Declaro ciência dos custos de abertura do processo junto ao INPI e de cada ato do processo do pedido de programa de computador.", payload.declaracoes.ciencia_custos_inpi);
        linhaCheckbox("Declaro que guardarei, de forma segura e separada, o arquivo compactado usado para gerar o hash do código-fonte, pelo prazo de vigência da proteção legal (50 anos, art. 2º, §2º da Lei nº 9.609/98).", payload.declaracoes.guarda_hash_50_anos);
        linhaCheckbox("Declaro que cada autor manterá a guarda de uma cópia do software a ser protegido, pelo prazo de vigência da proteção legal (50 anos, art. 2º, §2º da Lei nº 9.609/98), para eventual necessidade de comprovação ou modificação futura.", payload.declaracoes.guarda_copia_autores);
        linhaCheckbox("Declaro que as informações relativas aos dados contidos neste formulário são verdadeiras e autênticas (fiéis à verdade e condizentes com a realidade dos fatos à época).", payload.declaracoes.veracidade_informacoes);

        // Só ASCII: todo caractere acima de 0x7e vira \uXXXX. É o mesmo JSON (o parser devolve
        // exatamente os mesmos textos), mas o bloco impresso nunca tem caractere que a fonte
        // não imprime, e o sha256= é do texto que está de fato no PDF.
        var jsonTexto = JSON.stringify(payload).replace(/[\u007f-\uffff]/g, function(c){
          return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
        });

        return sha256Hex(jsonTexto).then(function(shaTexto){
          novaPagina();
          tituloSecao("Anexo A — dados estruturados");
          paragrafoSimples(
            "Bloco de texto abaixo é a fonte legível por máquina desta submissão. Sobrevive a reimpressão " +
            "ou re-salvamento do PDF, quando o anexo embutido eventualmente não sobreviver.",
            8
          );

          garantirEspaco(12);
          fluxo.pagina.drawText("-----BEGIN SUBMISSAO-JSON-----", { x: MARGEM, y: fluxo.y, size: 7, font: fonteMono, color: COR_TINTA_FRACA });
          fluxo.y -= 10;
          dividirEmLinhas(jsonTexto, 90).forEach(function(l){
            garantirEspaco(9);
            fluxo.pagina.drawText(l, { x: MARGEM, y: fluxo.y, size: 7, font: fonteMono, color: COR_TINTA_SUAVE });
            fluxo.y -= 9;
          });
          garantirEspaco(20);
          fluxo.pagina.drawText("-----END SUBMISSAO-JSON-----", { x: MARGEM, y: fluxo.y, size: 7, font: fonteMono, color: COR_TINTA_FRACA });
          fluxo.y -= 10;
          fluxo.pagina.drawText("sha256=" + shaTexto, { x: MARGEM, y: fluxo.y, size: 7, font: fonteMono, color: COR_TINTA_FRACA });
          fluxo.y -= 14;

          var bytesJson = new TextEncoder().encode(jsonTexto);
          return pdfDoc.attach(bytesJson, "submissao.json", {
            mimeType: "application/json",
            description: "Dados estruturados da submissão (título, autores, release)"
          });
        }).then(function(){
          desenharRodapes();
          return pdfDoc.save();
        });
      });
    });
  }

  // ================= rascunho: salvar / carregar =================

  function salvarRascunho(){
    var payload = buildPayload();
    var texto = JSON.stringify(payload, null, 2);
    baixarArquivo(new Blob([texto], { type: "application/json" }), "rascunho-submissao.json", "application/json");
    formularioSujo = false;
    mostrarFeedbackRascunho("Rascunho baixado.", "ok");
  }

  function carregarRascunho(payload){
    var sw = payload.software || {};
    $("titulo").value = sw.titulo || "";
    $("descricao_curta").value = sw.descricao_curta || "";
    $("descricao_curta").dispatchEvent(new Event("input"));
    $("trl").value = sw.trl ? String(sw.trl) : "";
    renderTrlPicker();
    $("origem_tipo").value = (sw.origem && sw.origem.tipo) || "";
    $("origem_vinculo").value = (sw.origem && sw.origem.vinculo) || "";
    $("data_criacao").value = sw.data_criacao || "";
    $("data_publicacao").value = sw.data_publicacao || "";
    $("informe_projeto").value = sw.informe_projeto || "";

    replaceTagValues("linguagens", sw.linguagens);
    replaceTagValues("area_aplicacao", sw.area_aplicacao);
    replaceTagValues("tipo_programa", sw.tipo_programa);
    replaceTagValues("palavras_chave", sw.palavras_chave);

    state.instituicoes_parceiras = (Array.isArray(payload.instituicoes_parceiras) ? payload.instituicoes_parceiras : []).map(function(inst){
      var completo = instituicaoVazia();
      Object.keys(inst || {}).forEach(function(k){ completo[k] = inst[k]; });
      return completo;
    });
    renderInstituicoes();

    state.autores = (Array.isArray(payload.autores) && payload.autores.length)
      ? payload.autores.map(function(a){
          var completo = autorVazio();
          completo.nome = a.nome || "";
          completo.nacionalidade = a.nacionalidade || "";
          completo.cpf = a.cpf || "";
          completo.instituicao_tipo = a.instituicao_tipo || "";
          completo.campus = a.campus || "";
          completo.tipo_vinculo = a.tipo_vinculo || "";
          completo.endereco_independente = a.instituicao_tipo === "independente" ? (a.endereco || "") : "";
          completo.telefone = a.telefone || "";
          completo.email = a.email || "";
          completo.email_alternativo = a.email_alternativo || "";
          completo.qualificacao_profissional = a.qualificacao_profissional || "";
          if(a.instituicao_tipo === "parceira" && a.instituicao_nome){
            var idx = state.instituicoes_parceiras.findIndex(function(inst){ return inst.razao_social === a.instituicao_nome; });
            completo.instituicao_parceira_idx = idx !== -1 ? String(idx) : "";
          }
          return completo;
        })
      : [autorVazio()];
    renderAutores();

    var autorizada = !!(payload.derivacao && payload.derivacao.autorizada);
    document.querySelectorAll('input[name="derivacao_autorizada"]').forEach(function(r){
      r.checked = autorizada ? r.value === "sim" : r.value === "nao";
    });
    document.querySelectorAll(".radio-pill").forEach(function(pill){
      pill.classList.toggle("selected", pill.querySelector("input").checked);
    });
    $("derivacao-detalhes-wrap").hidden = !autorizada;
    $("derivacao_titulo_original").value = (payload.derivacao && payload.derivacao.titulo_original) || "";
    $("derivacao_linguagem_original").value = (payload.derivacao && payload.derivacao.linguagem_original) || "";
    $("derivacao_numero_registro").value = (payload.derivacao && payload.derivacao.numero_registro_inpi_original) || "";

    $("comercializacao_compromisso").checked = !!(payload.comercializacao && payload.comercializacao.compromisso_informar_cie);

    var d = payload.declaracoes || {};
    $("decl_acompanhamento").checked = !!d.responsabilidade_acompanhamento;
    $("decl_busca_anterioridade").checked = !!d.responsabilidade_busca_anterioridade;
    $("decl_custos_inpi").checked = !!d.ciencia_custos_inpi;
    $("decl_guarda_hash").checked = !!d.guarda_hash_50_anos;
    $("decl_guarda_copia").checked = !!d.guarda_copia_autores;
    $("decl_guarda_derivacao").checked = !!d.guarda_autorizacao_derivacao;
    $("decl_veracidade").checked = !!d.veracidade_informacoes;

    document.querySelectorAll("[data-decl-card]").forEach(function(card){
      var native = card.querySelector(".decl-native");
      card.classList.toggle("checked", native.checked);
    });

    $("release-tag").value = (payload.release && payload.release.tag) || "";
    $("release-sha512").value = (payload.release && payload.release.sha512) || "";
    var repo = (payload.release && payload.release.repositorio) || "";
    var prefixo = GITHUB_ORG + "/";
    $("release-repo-sufixo").value = repo.indexOf(prefixo) === 0 ? repo.slice(prefixo.length) : repo;

    var mat = payload.maturidade || {};
    var emp = mat.empresa_interessada || null;
    var interessada = !!emp;
    document.querySelectorAll('input[name="empresa_interessada"]').forEach(function(r){
      r.checked = interessada ? r.value === "sim" : r.value === "nao";
    });
    document.querySelectorAll(".radio-pill").forEach(function(pill){
      pill.classList.toggle("selected", pill.querySelector("input").checked);
    });
    $("trl_justificativa").value = mat.justificativa || "";
    $("trl_justificativa").dispatchEvent(new Event("input"));
    $("interessada_razao_social").value = emp ? (emp.razao_social || "") : "";
    $("interessada_cnpj").value = emp ? (emp.cnpj || "") : "";
    var tiposSalvos = emp && Array.isArray(emp.tipos_de_interesse) ? emp.tipos_de_interesse : [];
    document.querySelectorAll("#interesse-tipos input[type=checkbox]").forEach(function(c){
      c.checked = tiposSalvos.indexOf(c.value) !== -1;
      c.closest(".chip").classList.toggle("checked", c.checked);
    });
    $("interesse_parceria_projeto").value = emp ? (emp.projeto_parceria || "") : "";
    $("interesse_outro_descricao").value = emp ? (emp.outro_descricao || "") : "";
    $("decl_carta_interesse").checked = !!mat.carta_interesse_sera_anexada;
    $("decl_carta_interesse").dispatchEvent(new Event("change"));

    renderCotitularidade();
    if(payload.parceria){
      if(Array.isArray(payload.parceria.cotitularidade)){
        var propriaEntry = payload.parceria.cotitularidade.filter(function(c){ return c.instituicao_tipo === "propria"; })[0];
        $("cotitularidade-propria").value = propriaEntry && propriaEntry.percentual != null ? String(propriaEntry.percentual) : "";
        cotitularesParceiras(payload.parceria.cotitularidade).forEach(function(c, i){
          var input = document.querySelector('#cotitularidade-parceiras-list [data-idx="' + i + '"]');
          if(input) input.value = c.percentual != null ? String(c.percentual) : "";
          var ta = document.querySelector('#cotitularidade-justificativas-list [data-just-idx="' + i + '"]');
          if(ta){ ta.value = c.justificativa || ""; ta.dispatchEvent(new Event("input")); }
        });
      }
    } else {
      $("cotitularidade-propria").value = "";
    }

    formularioSujo = false;
    touchedEls = new WeakSet();
    stepsTouched = {};
    goToStep("identificacao");
    renderTudo();
  }

  // ================= inicialização =================

  [document].concat(Array.prototype.map.call(document.querySelectorAll("template"), function(t){ return t.content; }))
    .forEach(function(raiz){
      raiz.querySelectorAll("[data-instituicao]").forEach(function(el){
        el.textContent = el.getAttribute("data-instituicao") === "nome-e-sigla" ? nomeESiglaInstituicao() : INSTITUICAO.sigla;
      });
    });
  $("repo-prefix-badge").textContent = GITHUB_ORG + "/";
  $("link-tabela-area").href = LINK_TABELA_CAMPO_APLICACAO;
  $("link-tabela-tipo").href = LINK_TABELA_TIPO_PROGRAMA;
  $("link-integra").href = LINK_CIE_PROGRAMA_COMPUTADOR;

  renderTrlPicker();
  construirTiposDeInteresse();

  buildChipPicker("linguagens-chips", LINGUAGENS_COMUNS, "linguagens");

  document.querySelectorAll("[data-add-tag]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var key = btn.getAttribute("data-add-tag");
      var inputId = key === "linguagens" ? "linguagens-custom" : "palavras-custom";
      var input = $(inputId);
      if(addTagValue(key, input.value)) input.value = "";
      input.focus();
    });
  });

  ["linguagens-custom", "palavras-custom"].forEach(function(id){
    $(id).addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        var key = id === "linguagens-custom" ? "linguagens" : "palavras_chave";
        if(addTagValue(key, $(id).value)) $(id).value = "";
      }
    });
  });

  buildSearchPicker("area-search", "area-listbox", CAMPO_APLICACAO_ITEMS, "area_aplicacao");
  buildSearchPicker("tipo-search", "tipo-listbox", TIPO_PROGRAMA_ITEMS, "tipo_programa");

  renderInstituicoes();
  $("add-instituicao").addEventListener("click", function(){
    state.instituicoes_parceiras.push(instituicaoVazia());
    renderInstituicoes();
    renderAutores();
    renderCotitularidade();
    renderTudo();
  });
  $("instituicoes-list").addEventListener("input", sincronizarCampoInstituicao);
  $("instituicoes-list").addEventListener("change", sincronizarCampoInstituicao);

  renderAutores();
  $("add-autor").addEventListener("click", function(){
    state.autores.push(autorVazio());
    renderAutores();
    renderTudo();
  });
  $("autores-list").addEventListener("input", sincronizarCampoAutor);
  $("autores-list").addEventListener("change", sincronizarCampoAutor);

  renderCotitularidade();

  document.querySelectorAll('input[name="derivacao_autorizada"]').forEach(function(r){
    r.addEventListener("change", function(){
      var marcado = document.querySelector('input[name="derivacao_autorizada"]:checked');
      $("derivacao-detalhes-wrap").hidden = !(marcado && marcado.value === "sim");
      document.querySelectorAll(".radio-pill").forEach(function(pill){
        pill.classList.toggle("selected", pill.querySelector("input").checked);
      });
    });
  });

  document.querySelectorAll('input[name="empresa_interessada"]').forEach(function(r){
    r.addEventListener("change", function(){
      document.querySelectorAll(".radio-pill").forEach(function(pill){
        pill.classList.toggle("selected", pill.querySelector("input").checked);
      });
    });
  });

  document.querySelectorAll("[data-decl-card]").forEach(function(card){
    var native = card.querySelector(".decl-native");
    function sync(){ card.classList.toggle("checked", native.checked); }
    sync();
    card.addEventListener("click", function(e){
      // clique no <label> ou no próprio checkbox já alterna nativamente
      // (e já dispara "change" sozinho) — só cuidamos do resto do cartão.
      if(e.target === native || e.target.tagName === "A" || e.target.closest("label")) return;
      native.checked = !native.checked;
      native.dispatchEvent(new Event("change", { bubbles: true }));
    });
    native.addEventListener("change", sync);
  });

  $("trl_justificativa").addEventListener("input", function(){
    var n = $("trl_justificativa").value.length;
    var counter = $("trl-justificativa-count");
    counter.textContent = n + " caracteres (mínimo " + MIN_CARACTERES_PARAGRAFO + ")";
    counter.classList.toggle("short", n < MIN_CARACTERES_PARAGRAFO);
  });

  $("descricao_curta").addEventListener("input", function(){
    var n = $("descricao_curta").value.length;
    var counter = $("descricao-count");
    counter.textContent = n + " caracteres (mínimo 120)";
    counter.classList.toggle("short", n < 120);
  });

  document.querySelectorAll("[data-info-toggle]").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var id = btn.getAttribute("data-info-toggle");
      var pop = document.getElementById(id);
      if(!pop) return;
      var estavaAberto = !pop.hidden;
      document.querySelectorAll(".info-popover").forEach(function(p){ p.hidden = true; });
      pop.hidden = estavaAberto;
    });
  });
  document.addEventListener("click", function(){
    document.querySelectorAll(".info-popover").forEach(function(p){ p.hidden = true; });
  });

  document.addEventListener("blur", function(e){
    if(!e.target || !e.target.closest) return;
    if(e.target.closest(".wizard-step")){
      touchedEls.add(e.target);
      renderTudo();
    }
  }, true);

  var wizardBody = document.querySelector(".wizard-body");
  wizardBody.addEventListener("input", function(){ formularioSujo = true; renderTudo(); });
  wizardBody.addEventListener("change", function(){ formularioSujo = true; renderTudo(); });

  window.addEventListener("beforeunload", function(e){
    if(formularioSujo){
      e.preventDefault();
      e.returnValue = "";
    }
  });

  $("wizard-voltar").addEventListener("click", function(){
    var visible = computeVisibleSteps();
    var idx = visible.findIndex(function(s){ return s.id === currentStepId; });
    if(idx === 0){
      if(confirm("Isso vai limpar todos os dados preenchidos neste formulário. Continuar?")){
        location.reload();
      }
      return;
    }
    goToStep(visible[idx - 1].id);
  });

  $("wizard-proximo").addEventListener("click", function(){
    stepsTouched[currentStepId] = true;
    renderTudo();
    var visible = computeVisibleSteps();
    var idx = visible.findIndex(function(s){ return s.id === currentStepId; });
    if(idx < visible.length - 1) goToStep(visible[idx + 1].id);
  });

  $("btn-gerar-pdf").addEventListener("click", function(){
    var payload = renderTudo();
    var pendentes = validateAll(payload);
    if(pendentes.length > 0){
      mostrarStatusPdf("Corrija os itens pendentes antes de gerar o PDF.", "error");
      return;
    }
    mostrarStatusPdf("Gerando PDF...", "info");
    gerarPdf(payload).then(function(bytes){
      baixarArquivo(bytes, nomeArquivoPdf(payload), "application/pdf");
      formularioSujo = false;
      var aviso = substituicoesPdf.length
        ? " Atenção: o PDF não imprime alguns caracteres, que foram simplificados no texto impresso (" +
          substituicoesPdf.slice(0, 8).join(", ") + (substituicoesPdf.length > 8 ? ", …" : "") +
          "). Os dados originais seguem intactos no anexo do PDF; se quiser o texto impresso certo, troque esses caracteres no formulário."
        : "";
      mostrarStatusPdf("PDF gerado. Anexe ao processo no SIPAC e apague o arquivo do seu computador depois." + aviso, substituicoesPdf.length ? "info" : "ok");
    }).catch(function(erro){
      mostrarStatusPdf("Erro ao gerar o PDF: " + erro.message, "error");
    });
  });

  $("btn-baixar-rascunho").addEventListener("click", salvarRascunho);

  $("input-carregar-rascunho").addEventListener("change", function(e){
    var arquivo = e.target.files[0];
    if(!arquivo) return;
    if(!confirm("Isso vai sobrescrever todos os dados já preenchidos neste formulário. Continuar?")){
      e.target.value = "";
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function(){
      try{
        var payload = JSON.parse(leitor.result);
        carregarRascunho(payload);
        mostrarFeedbackRascunho("Rascunho carregado — revise os campos.", "ok");
      } catch(erro){
        mostrarFeedbackRascunho("Não foi possível ler o rascunho (" + erro.message + ").", "error");
      }
    };
    leitor.readAsText(arquivo);
    e.target.value = "";
  });

  // ================= preenchimento pelo link do repositório =================
  //
  // O README do repositório de submissão traz um link para este formulário com
  // título, TRL, origem, repositório, release e SHA-512 no FRAGMENTO (#...), não
  // na query string: o fragmento nunca sai do navegador (não vai ao servidor nem
  // a log nenhum), o que mantém a regra de que nada daqui é enviado a lugar
  // nenhum. Os valores entram só como TEXTO (.value), nunca como HTML, e cada
  // um é validado; qualquer valor fora do formato é ignorado. Dado pessoal
  // nunca viaja por aqui. Qualquer pessoa pode montar um link, por isso o aviso
  // pede que o docente confira.

  var LIMITE_TITULO = 250;

  function lerFragmento(){
    var bruto = (window.location.hash || "").replace(/^#/, "");
    try { return new URLSearchParams(bruto); } catch(e) { return new URLSearchParams(""); }
  }

  function marcarPreenchido(el){
    if(el) el.classList.add("preenchido-pelo-link");
  }

  function aplicarFragmento(){
    var q = lerFragmento();
    var aplicados = 0;

    var titulo = (q.get("titulo") || "").trim().slice(0, LIMITE_TITULO);
    if(titulo.length >= 3){ $("titulo").value = titulo; marcarPreenchido($("titulo")); aplicados++; }

    var trl = parseInt(q.get("trl"), 10);
    if(trl >= 1 && trl <= 9){
      $("trl").value = String(trl);
      renderTrlPicker();
      marcarPreenchido($("trl-picker"));
      aplicados++;
    }

    var origem = q.get("origem") || "";
    var opcaoOrigem = Array.prototype.some.call($("origem_tipo").options, function(o){ return o.value === origem && origem !== ""; });
    if(opcaoOrigem){ $("origem_tipo").value = origem; marcarPreenchido($("origem_tipo")); aplicados++; }

    var repositorio = q.get("repositorio") || "";
    if(/^[A-Za-z0-9._-]{1,100}$/.test(repositorio)){ $("release-repo-sufixo").value = repositorio; marcarPreenchido($("release-repo-sufixo")); aplicados++; }

    var release = q.get("release") || "";
    if(/^[^\s<>"'`]{1,100}$/.test(release)){ $("release-tag").value = release; marcarPreenchido($("release-tag")); aplicados++; }

    var sha = (q.get("sha512") || "").trim();
    if(/^[0-9a-fA-F]{128}$/.test(sha)){ $("release-sha512").value = sha.toLowerCase(); marcarPreenchido($("release-sha512")); aplicados++; }

    if($("aviso-link")) $("aviso-link").hidden = aplicados === 0;
  }

  aplicarFragmento();
  goToStep("identificacao");
  renderTudo();
})();
