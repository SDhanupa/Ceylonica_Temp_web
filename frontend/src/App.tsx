import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApolloProvider } from '@apollo/client';
import { Box } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { LanguageProvider } from './context/LanguageContext';
import apolloClient from './api/apolloClient';

import UserDashboard from './pages/UserDashboard';
import CategoryDetailPage from './pages/CategoryDetailPage';
import IndustrySurveyPage from './pages/IndustrySurveyPage';
import PublicBusinessProfilePage from './pages/PublicBusinessProfilePage';

/**
 * Public portal: the main app's App.tsx reduced to the GN page and industry
 * survey routes (same paths, same provider stack). /gnpage renders what the
 * main app's DashboardPage renders for a signed-out visitor.
 */
const GnPage: React.FC = () => (
  <Box>
    <UserDashboard user={null} />
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
              <Routes>
              {/* Home → redirect to GN page */}
              <Route
                path="/"
                element={<Navigate to="/gnpage" replace />}
              />

              <Route
                path="/gnpage"
                element={<GnPage />}
              />
              {/* Direct GN Link Route */}
              <Route
                path="/gnpage/:gnName/:ccode"
                element={<GnPage />}
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
                path="/business/:regNumber"
                element={<PublicBusinessProfilePage />}
              />
              <Route
                path="/gnpage/:gnName/:ccode/:categorySlug"
                element={<CategoryDetailPage />}
              />

              <Route path="*" element={<Navigate to="/gnpage" replace />} />
              </Routes>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </ApolloProvider>
  );
};

export default App;
