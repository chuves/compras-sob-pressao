import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RecipesPage } from "./features/recipes/RecipesPage";
import { RecipeDetailPage } from "./features/recipes/RecipeDetailPage";
import { WeeklyListPage } from "./features/weeklyList/WeeklyListPage";
import { ShoppingListPage } from "./features/shoppingList/ShoppingListPage";
import { HistoryPage } from "./features/history/HistoryPage";
import { FavoritesPage } from "./features/favorites/FavoritesPage";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RecipesPage />} />
          <Route path="receita/:slug" element={<RecipeDetailPage />} />
          <Route path="semana" element={<WeeklyListPage />} />
          <Route path="lista/:listId" element={<ShoppingListPage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="favoritos" element={<FavoritesPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
