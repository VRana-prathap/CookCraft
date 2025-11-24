
const tabBtns = document.querySelectorAll('.tab-btn');
const searchForms = document.querySelectorAll('.search-form');
const searchInput = document.getElementById('search-input');
const letterInput = document.getElementById('letter-input');
const categorySelect = document.getElementById('category-select');
const areaSelect = document.getElementById('area-select');
const ingredientInput = document.getElementById('ingredient-input');

const searchBtn = document.getElementById('search-btn');
const letterBtn = document.getElementById('letter-btn');
const categoryBtn = document.getElementById('category-btn');
const areaBtn = document.getElementById('area-btn');
const ingredientBtn = document.getElementById('ingredient-btn');

const mealsContainer = document.getElementById('meals');
const resultHeading = document.getElementById('result-heading');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const mealDetails = document.getElementById('meal-details');
const mealDetailsContent = document.querySelector('.meal-details-content');
const backBtn = document.getElementById('back-btn');
const loadingEl = document.getElementById('loading');

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
const SEARCH_BY_NAME = `${BASE_URL}search.php?s=`;
const SEARCH_BY_LETTER = `${BASE_URL}search.php?f=`;
const LOOKUP_MEAL = `${BASE_URL}lookup.php?i=`;
const FILTER_BY_CATEGORY = `${BASE_URL}filter.php?c=`;
const FILTER_BY_AREA = `${BASE_URL}filter.php?a=`;
const FILTER_BY_INGREDIENT = `${BASE_URL}filter.php?i=`;

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadAreas();
});

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    searchForms.forEach(form => form.classList.remove('active'));
    document.querySelector(`.search-form[data-form="${tab}"]`).classList.add('active');
  });
});


searchBtn.addEventListener('click', () => searchByName(searchInput.value.trim()));
letterBtn.addEventListener('click', () => searchByLetter(letterInput.value.trim().toUpperCase()));
categoryBtn.addEventListener('click', () => filterByCategory(categorySelect.value));
areaBtn.addEventListener('click', () => filterByArea(areaSelect.value));
ingredientBtn.addEventListener('click', () => filterByIngredient(ingredientInput.value.trim()));

searchInput.addEventListener('keypress', e => e.key === 'Enter' && searchByName(searchInput.value.trim()));
letterInput.addEventListener('keypress', e => e.key === 'Enter' && searchByLetter(letterInput.value.trim().toUpperCase()));
ingredientInput.addEventListener('keypress', e => e.key === 'Enter' && filterByIngredient(ingredientInput.value.trim()));

backBtn.addEventListener('click', () => mealDetails.classList.add('hidden'));

async function searchByName(query) {
  if (!query) return showError('Please enter a meal name.');
  await fetchMeals(`${SEARCH_BY_NAME}${query}`, `Search results for "${query}":`);
}

async function searchByLetter(letter) {
  if (!letter || !/^[A-Z]$/i.test(letter)) return showError('Please enter a single letter (A–Z).');
  await fetchMeals(`${SEARCH_BY_LETTER}${letter.toUpperCase()}`, `Meals starting with "${letter.toUpperCase()}":`);
}

async function filterByCategory(category) {
  if (!category) return showError('Please select a category.');
  await fetchMeals(`${FILTER_BY_CATEGORY}${category}`, `Meals in category: ${category}`);
}

async function filterByArea(area) {
  if (!area) return showError('Please select a cuisine.');
  await fetchMeals(`${FILTER_BY_AREA}${area}`, `Meals from ${area}`);
}

async function filterByIngredient(ingredient) {
  if (!ingredient) return showError('Please enter an ingredient.');
  await fetchMeals(`${FILTER_BY_INGREDIENT}${ingredient}`, `Meals with ingredient: ${ingredient}`);
}

async function fetchMeals(url, heading) {
  showLoading();
  hideError();
  try {
    const res = await fetch(url);
    const data = await res.json();

    hideLoading();

    let meals = null;
    if (url.includes('lookup.php')) {
      meals = data.meals ? [data.meals[0]] : null;
    } else {
      meals = data.meals;
    }

    if (!meals || meals.length === 0) {
      showError('No meals found. Try a different search!');
      resultHeading.textContent = '';
    } else {
      resultHeading.textContent = heading;
      displayMeals(meals);
    }
  } catch (err) {
    hideLoading();
    showError('Failed to load meals. Please try again.');
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${BASE_URL}list.php?c=list`);
    const data = await res.json();
    if (data.meals) {
      data.meals.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.strCategory;
        option.textContent = cat.strCategory;
        categorySelect.appendChild(option);
      });
    }
  } catch (e) {
    console.warn('Could not load categories');
  }
}

async function loadAreas() {
  try {
    const res = await fetch(`${BASE_URL}list.php?a=list`);
    const data = await res.json();
    if (data.meals) {
      data.meals.forEach(area => {
        const option = document.createElement('option');
        option.value = area.strArea;
        option.textContent = area.strArea;
        areaSelect.appendChild(option);
      });
    }
  } catch (e) {
    console.warn('Could not load areas');
  }
}

function displayMeals(meals) {
  mealsContainer.innerHTML = meals.map(meal => `
    <div class="meal" data-meal-id="${meal.idMeal}">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
      <div class="meal-info">
        <h3 class="meal-title">${meal.strMeal}</h3>
        ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ''}
      </div>
    </div>
  `).join('');
}

async function handleMealClick(e) {
  const mealEl = e.target.closest('.meal');
  if (!mealEl) return;
  const id = mealEl.dataset.mealId;
  showLoading();
  try {
    const res = await fetch(`${LOOKUP_MEAL}${id}`);
    const data = await res.json();
    hideLoading();
    if (data.meals?.[0]) {
      const meal = data.meals[0];
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`]?.trim();
        const measure = meal[`strMeasure${i}`]?.trim();
        if (ing) ingredients.push({ ingredient: ing, measure: measure || '' });
      }

      mealDetailsContent.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img" loading="lazy">
        <h2 class="meal-details-title">${meal.strMeal}</h2>
        <div class="meal-details-category">
          <span>${meal.strCategory || "Uncategorized"}</span>
        </div>
        <div class="meal-details-instructions">
          <h3>Instructions</h3>
          <p>${meal.strInstructions}</p>
        </div>
        <div class="meal-details-ingredients">
          <h3>Ingredients (${ingredients.length})</h3>
          <ul class="ingredients-list">
            ${ingredients.map(item => `
              <li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>
            `).join('')}
          </ul>
        </div>
        ${meal.strYoutube ? `
          <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
            <i class="fab fa-youtube"></i> Watch on YouTube
          </a>
        ` : ''}
      `;
      mealDetails.classList.remove('hidden');
      mealDetails.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    hideLoading();
    showError('Could not load recipe details.');
  }
}

mealsContainer.addEventListener('click', handleMealClick);

function showLoading() {
  loadingEl.classList.remove('hidden');
  errorContainer.classList.add('hidden');
  mealsContainer.classList.add('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
  mealsContainer.classList.remove('hidden');
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorContainer.classList.remove('hidden');
}

function hideError() {
  errorContainer.classList.add('hidden');
}