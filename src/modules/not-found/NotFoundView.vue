<template>
  <div class="notfound">
    <i class="pi pi-exclamation-circle notfound__icon"></i>
    <h1>404</h1>
    <p>Страница не найдена</p>
    <RouterLink to="/">Вернуться в каталог</RouterLink>
  </div>
</template>

<style scoped>
.notfound {
  text-align: center;
  padding: 4rem 1rem;
  color: #6e7580;
}

.notfound__icon {
  font-size: 3rem;
  opacity: 0.5;
}

.notfound h1 {
  font-size: 2.5rem;
  margin: 0.5rem 0 0;
}

.notfound p {
  margin: 0.25rem 0 1rem;
}
</style>