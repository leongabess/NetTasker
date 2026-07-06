# NetTasker

<h2>API feita utilizando ASP.NET Core com C# para criação de usuários, gerenciamento de tarefas, com autenticação e armazenamento seguro de senha</h2>

<p>Atualmente a API conta com as funções de criação de usuário, login com autenticação e retorno de token, assim como criação e manipulação de tarefas com a devida verificação do usuário.</p>
<p>O hash da senha é feito através do BCrypt, para um balanço de eficiência e segurança.</p>
<p>O armazenamento é feito no SQL Server, também possui os esquemas de migration para a criação das tabelas usuário e atividades. Testes das rotas foram feitos no postman.</p>

# Testes de rotas do backend
<details><summary>Criação de usuário</summary>

  ```
  Url: http://localhost:5155/users/register

  Valor no BODY no formato JSON:

  {
  "name": "user",
  "userName": "userName",
  "password": "password"
}
```
</details>

<br> 
<details><summary>Login de usuário</summary>

  ```
  Url: http://localhost:5155/users/login

  Metódo POST com valor no BODY no formato JSON:

  {
  "username": "userName",
  "password": "password"
}
```
</details>
<br> 
<details><summary>Criação de tarefas após obter o token</summary>

  ```
  Url: http://localhost:5155/todoitems

  Metódo POST com valor no BODY no formato JSON:

  {
  "id": 0,
  "name": "Atividade 3",
  "isComplete": false,
  "userId": 1
}
```
</details>
<br> 
<details><summary>Visualizar tarefas após obter o token</summary>

  ```
  Url: http://localhost:5155/todoitems

  Utilizar o token obtido com o login e usar metódo GET diretamente na url.
```
</details>
<br> 
<details><summary>Criação de usuário</summary>

  ```
  Url: http://localhost:5155/todoitems/{id}

  Metódo PUT com valor no BODY no formato JSON:

  {
  "id": 0,
  "name": "name",
  "isComplete": false,
  "userId": 0
}
```
</details>
<br> 
<details><summary>Criação de usuário</summary>

  ```
  Url: http://localhost:5155/todoitems/{id}

  Utilizar o token obtido com o login e usar metódo DELETE com a ID da atividade na URL.
```
</details>

# Futuras atualizações
<ul>
  <li>Finalizar home do usuário no front-end</li>
  <li>Conexão do front-end junto ao back-end</li>
</ul>
