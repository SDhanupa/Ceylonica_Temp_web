import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
});

const retryLink = new RetryLink({
  delay: {
    initial: 1000,
    max: 10000,
    jitter: true,
  },
  attempts: {
    max: 2,
    retryIf: (error, _operation) => {
      // Retry if it's a network error (TypeError: Failed to fetch)
      if (error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
        return true;
      }
      // Or retry if it's a 5xx server error
      if (error && error.statusCode >= 500) {
        return true;
      }
      // Don't retry on GraphQL validation errors or 4xx errors
      return !!error && !error.statusCode;
    },
  },
});

const apolloClient = new ApolloClient({
  // Public portal: no auth link (no Keycloak, no guest token).
  link: ApolloLink.from([retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;
