import React, { Suspense, lazy } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApolloProvider } from '@apollo/client';
import theme from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { LanguageProvider } from './context/LanguageContext';
import apolloClient from './api/apolloClient';

import FruitLandingPage from './pages/FruitLandingPage';
// The GN landing page is the entry point and stays in the main bundle; the
// other pages load on first visit.
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'));
const IndustrySurveyPage = lazy(() => import('./pages/IndustrySurveyPage'));
const PublicBusinessProfilePage = lazy(() => import('./pages/PublicBusinessProfilePage'));

const PageLoading: React.FC = () => (
  <Box role="progressbar" aria-label="Loading" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
    <LinearProgress color="success" />
  </Box>
);

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <LanguageProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Suspense fallback={<PageLoading />}>
              <Routes>
              {/* Home → redirect to GN page */}
              <Route
                path="/"
                element={<Navigate to="/gnpage" replace />}
              />

              <Route
                path="/gnpage"
                element={<FruitLandingPage />}
              />
              {/* Direct GN Link Route */}
              <Route
                path="/gnpage/:gnName/:ccode"
                element={<FruitLandingPage />}
              />
              <Route
                path="/industry-survey"
                element={<IndustrySurveyPage />}
              />
              <Route
                path="/industry-survey/:gnName/:ccode"
                element={<IndustrySurveyPage />}
              />
              <Route
                path="/business"
                element={<PublicBusinessProfilePage />}
              />
              <Route
                path="/business/:regNumber"
                element={<PublicBusinessProfilePage />}
              />
              <Route
                path="/gnpage/:gnName/:ccode/:categorySlug"
                element={<CategoryDetailPage />}
              />

              <Route path="*" element={<Navigate to="/gnpage" replace />} />
              </Routes>
              </Suspense>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </ApolloProvider>
  );
};

export default App;
