# NetTasker

<h2>API feita utilizando ASP.NET Core com C# para criação de usuários, gerenciamento de tarefas, com autenticação e armazenamento seguro de senha</h2>

<p>Atualmente a API conta com as funções de criação de usuário, login com autenticação e retorno de token, assim como criação e manipulação de tarefas com a devida verificação do usuário.</p>
<p>O hash da senha é feito através do BCrypt, para um balanço de eficiência e segurança.</p>
<p>O armazenamento é feito no SQL Server, também possui os esquemas de migration para a criação das tabelas usuário e atividades.</p>

<p>Futuras atualizações</p>
<ul>
  <li>Deletar tarefas</li>
  <li>Front-end para consumo da API</li>
</ul>
