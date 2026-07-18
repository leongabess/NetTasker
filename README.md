# NetTasker

<h2>API feita utilizando ASP.NET Core com C# e Angular para criação de usuários, gerenciamento de tarefas, autenticação e armazenamento seguro de senha</h2>

<p>Atualmente a API conta com as funções de criação de usuário, login com autenticação, armazenamento e exclusão do token, assim como criação e manipulação de tarefas com a devida verificação do usuário.</p>

<p>O hash da senha é feito através do BCrypt, para um balanço de eficiência e segurança.</p>

<p>O armazenamento é feito no SQL Server, também possui os esquemas de migration para a criação das tabelas usuário e atividades. Testes das rotas foram feitos no postman.</p>

<p>No front-end está sendo utilizado o framework Angular para direcionamento das rotas, interface do usuário e autenticação necessária.</p>


# Preview do front-end em ação


https://github.com/user-attachments/assets/0b7a5cab-5bbd-4c83-935f-5c81c3f020e6

https://github.com/user-attachments/assets/3dac1352-48bf-48a6-ad0d-b2c976af8333

https://github.com/user-attachments/assets/13a7699b-bb03-4f77-b5b4-54a7a55343c8

https://github.com/user-attachments/assets/9ae3511b-a327-49a8-9473-2a379288fa0f



# Testes de rotas do back-end
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
<details><summary>Edição de atividades</summary>

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
<details><summary>Exclusão de atividades</summary>

  ```
  Url: http://localhost:5155/todoitems/{id}

  Utilizar o token obtido com o login e usar metódo DELETE com a ID da atividade na URL.
```
</details>

# Futuras atualizações
<ul>
  <li>Adicionar opção para que usário adicione foto de perfil</li>
  <li>Aviso de confirmação antes do logout</li>
  <li>Dar deploy no site</li>
</ul>
