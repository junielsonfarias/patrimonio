const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  console.log('🧹 Limpando dados existentes...');
  await prisma.logAtividade.deleteMany();
  await prisma.manutencao.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.transferencia.deleteMany();
  await prisma.patrimonio.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.secretaria.deleteMany();

  // Criar secretarias
  const secretaria1 = await prisma.secretaria.create({
    data: {
      codigo: '01',
      nome: 'Secretaria de Administração',
      descricao: 'Secretaria responsável pela administração geral',
      status: 'ATIVA',
      dataInicio: new Date('2020-01-01'),
      responsavel: 'João Silva',
    },
  });

  const secretaria2 = await prisma.secretaria.create({
    data: {
      codigo: '02',
      nome: 'Secretaria de Educação',
      descricao: 'Secretaria responsável pela educação municipal',
      status: 'ATIVA',
      dataInicio: new Date('2020-01-01'),
      responsavel: 'Maria Santos',
    },
  });

  const secretaria3 = await prisma.secretaria.create({
    data: {
      codigo: '03',
      nome: 'Secretaria de Saúde',
      descricao: 'Secretaria responsável pela saúde municipal',
      status: 'ATIVA',
      dataInicio: new Date('2020-01-01'),
      responsavel: 'Pedro Costa',
    },
  });

  console.log('✅ Secretarias criadas');

  // Criar funcionários
  const funcionario1 = await prisma.funcionario.create({
    data: {
      nome: 'João Silva',
      cpf: '123.456.789-00',
      email: 'joao.silva@prefeitura.gov.br',
      telefone: '(11) 99999-9999',
      cargo: 'Secretário',
      setor: 'Administração',
      secretariaId: secretaria1.id,
      matricula: '001',
      status: 'ATIVO',
      dataAdmissao: new Date('2020-01-01'),
    },
  });

  const funcionario2 = await prisma.funcionario.create({
    data: {
      nome: 'Maria Santos',
      cpf: '987.654.321-00',
      email: 'maria.santos@prefeitura.gov.br',
      telefone: '(11) 88888-8888',
      cargo: 'Secretária',
      setor: 'Educação',
      secretariaId: secretaria2.id,
      matricula: '002',
      status: 'ATIVO',
      dataAdmissao: new Date('2020-01-01'),
    },
  });

  const funcionario3 = await prisma.funcionario.create({
    data: {
      nome: 'Pedro Costa',
      cpf: '456.789.123-00',
      email: 'pedro.costa@prefeitura.gov.br',
      telefone: '(11) 77777-7777',
      cargo: 'Secretário',
      setor: 'Saúde',
      secretariaId: secretaria3.id,
      matricula: '003',
      status: 'ATIVO',
      dataAdmissao: new Date('2020-01-01'),
    },
  });

  console.log('✅ Funcionários criados');

  // Criar usuários do sistema
  const senhaHash = await bcrypt.hash('123456', 12);

  const usuario1 = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@prefeitura.gov.br',
      senha: senhaHash,
      role: 'SUPERVISOR',
      funcionarioId: funcionario1.id,
      isActive: true,
    },
  });

  const usuario2 = await prisma.usuario.create({
    data: {
      nome: 'Operador',
      email: 'operador@prefeitura.gov.br',
      senha: senhaHash,
      role: 'OPERADOR',
      funcionarioId: funcionario2.id,
      isActive: true,
    },
  });

  console.log('✅ Usuários criados');

  // Criar patrimônios
  const patrimonio1 = await prisma.patrimonio.create({
    data: {
      numero: '001',
      codigoSecretaria: '01',
      descricao: 'Computador Desktop Dell OptiPlex 7090',
      categoria: 'Informática',
      subcategoria: 'Computador',
      marca: 'Dell',
      modelo: 'OptiPlex 7090',
      numeroSerie: 'DL123456789',
      valor: 3500.00,
      valorAtual: 2800.00,
      dataAquisicao: new Date('2023-01-15'),
      vidaUtil: 5,
      secretariaId: secretaria1.id,
      localizacao: 'Sala 101 - Secretaria de Administração',
      responsavelId: funcionario1.id,
      status: 'ATIVO',
      situacao: 'NOVO',
      estadoConservacao: 'BOM',
      observacoes: 'Computador para uso administrativo',
    },
  });

  const patrimonio2 = await prisma.patrimonio.create({
    data: {
      numero: '002',
      codigoSecretaria: '02',
      descricao: 'Projetor Epson PowerLite 1781W',
      categoria: 'Audiovisual',
      subcategoria: 'Projetor',
      marca: 'Epson',
      modelo: 'PowerLite 1781W',
      numeroSerie: 'EP987654321',
      valor: 2500.00,
      valorAtual: 2000.00,
      dataAquisicao: new Date('2023-02-20'),
      vidaUtil: 8,
      secretariaId: secretaria2.id,
      localizacao: 'Sala de Aula 1 - Escola Municipal',
      responsavelId: funcionario2.id,
      status: 'ATIVO',
      situacao: 'NOVO',
      estadoConservacao: 'EXCELENTE',
      observacoes: 'Projetor para apresentações educacionais',
    },
  });

  const patrimonio3 = await prisma.patrimonio.create({
    data: {
      numero: '003',
      codigoSecretaria: '03',
      descricao: 'Mesa de Exame Médico',
      categoria: 'Mobiliário',
      subcategoria: 'Mesa',
      marca: 'Hospitalar Plus',
      modelo: 'HE-2000',
      numeroSerie: 'HP555666777',
      valor: 1200.00,
      valorAtual: 1000.00,
      dataAquisicao: new Date('2023-03-10'),
      vidaUtil: 10,
      secretariaId: secretaria3.id,
      localizacao: 'Consultório 1 - UBS Centro',
      responsavelId: funcionario3.id,
      status: 'ATIVO',
      situacao: 'NOVO',
      estadoConservacao: 'BOM',
      observacoes: 'Mesa para exames médicos',
    },
  });

  console.log('✅ Patrimônios criados');

  // Criar documentos
  await prisma.documento.create({
    data: {
      patrimonioId: patrimonio1.id,
      nome: 'Nota Fiscal - Computador Dell',
      tipo: 'NOTA_FISCAL',
      url: '/uploads/nota-fiscal-001.pdf',
      dataVencimento: null,
    },
  });

  await prisma.documento.create({
    data: {
      patrimonioId: patrimonio2.id,
      nome: 'Garantia - Projetor Epson',
      tipo: 'GARANTIA',
      url: '/uploads/garantia-002.pdf',
      dataVencimento: new Date('2026-02-20'),
    },
  });

  console.log('✅ Documentos criados');

  // Criar manutenções
  await prisma.manutencao.create({
    data: {
      patrimonioId: patrimonio1.id,
      funcionarioId: funcionario1.id,
      data: new Date('2023-06-15'),
      tipo: 'PREVENTIVA',
      descricao: 'Limpeza interna e atualização de drivers',
      valor: 150.00,
      responsavel: 'Técnico de TI',
    },
  });

  console.log('✅ Manutenções criadas');

  // Criar log de atividades
  await prisma.logAtividade.create({
    data: {
      usuarioId: funcionario1.id,
      patrimonioId: patrimonio1.id,
      acao: 'CREATE',
      entidade: 'Patrimonio',
      entidadeId: patrimonio1.id,
      campo: 'descricao',
      valorAnterior: null,
      valorNovo: 'Computador Desktop Dell OptiPlex 7090',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      sessaoId: 'sessao-001',
    },
  });

  console.log('✅ Log de atividades criado');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log(`- 3 Secretarias`);
  console.log(`- 3 Funcionários`);
  console.log(`- 2 Usuários do sistema`);
  console.log(`- 3 Patrimônios`);
  console.log(`- 2 Documentos`);
  console.log(`- 1 Manutenção`);
  console.log(`- 1 Log de atividade`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('Email: admin@prefeitura.gov.br | Senha: 123456 (SUPERVISOR)');
  console.log('Email: operador@prefeitura.gov.br | Senha: 123456 (OPERADOR)');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
