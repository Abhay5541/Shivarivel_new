# ShivariVel Construction & Interiors

# Application Architecture



## 1. Architecture Decision



The application uses a React + TypeScript PWA with Supabase as the backend platform.



Supabase replaces:



- Express

- Prisma

- Custom authentication

- Separate PostgreSQL backend infrastructure

- S3/R2 storage

- VPS cron



The product architecture remains a modular monolith from the application perspective.



---



# 2. Final Stack



## Frontend



- React

- TypeScript

- Tailwind CSS

- React Router

- TanStack Query

- React Hook Form

- Zod

- shadcn/ui

- Radix UI

- Recharts

- Vite

- Vite PWA



## Backend Platform



Supabase.



Components:



- Supabase Auth

- Supabase PostgreSQL

- PostgreSQL RLS

- PostgreSQL Views

- PostgreSQL Functions / RPC

- Supabase Edge Functions

- Supabase Storage

- pg_cron

- pg_net



## Testing



- Vitest

- Playwright

- pgTAP

- Deno tests for Edge Functions



---



# 3. High-Level Architecture



```text

User

  |

  v

React PWA

  |

  +--------------------+

  |                    |

  v                    v

Supabase Auth      Supabase PostgreSQL

                       |

             +---------+---------+

             |         |         |

             v         v         v

            RLS      Views      RPC

             |                   |

             |                   v

             |             Atomic Operations

             |

             v

        Business Data



React PWA

  |

  +--> Supabase Storage

  |

  +--> Edge Functions

             |

             +--> RPC

             +--> Storage

             +--> External services
