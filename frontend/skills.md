Architecture:

- strive to see application as paradigm of dumb and smart components:
    - smart components are the component who works with the framework ecosystem like: external services, application
      state, router, resolvers etc.
    - dumb components are component basically built to be shared since they are stateless and suppose to work as
      input-output interaction in order to be simply reused all over the application.
- follow to segregate layers of responsibilities according to the framework's entities tools and best practices
- similar logic has to be extracted and reused under shared folder
- use reactive forms in the application
- use folder segregation to keep clean structure of the project
- name method after its business logic
- max method lines is no more than 30 lines
- avoid deep nesting 2 levels max
