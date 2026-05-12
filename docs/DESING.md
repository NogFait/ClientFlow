DESIGN.md — ClientFlow: Sistema de Diseño y Estrategia UX
1. Filosofía del Diseño

ClientFlow se fundamenta en la claridad operativa y la reducción de la fricción cognitiva. Como herramienta dirigida a freelancers, el diseño busca transmitir una sensación de control, profesionalismo y agilidad.
Principios UX Clave:

    Minimalismo Funcional: Cada elemento en pantalla debe justificar su existencia. Si no ayuda al usuario a completar una tarea o tomar una decisión, se elimina.

    Claridad Visual: Uso de espacios en blanco (whitespace) para jerarquizar la información y permitir que el contenido "respire", similar a la experiencia en Linear.

    Productividad High-End: Una interfaz que se siente como una herramienta de precisión, inspirada en dashboards de alto rendimiento como Stripe.

    Confianza y Estabilidad: Una paleta de colores neutros con acentos vibrantes que comunica una plataforma robusta y moderna.

2. Identidad Visual
Paleta de Colores

La jerarquía cromática está diseñada para dirigir la atención y segmentar funciones sin abrumar al usuario.
Atributos Visuales

    Radios de Borde: Uso consistente de rounded-xl (12px) y rounded-2xl (16px) para suavizar la interfaz y darle un aspecto moderno tipo App.

    Sombras (Shadows): Sombras de baja intensidad (shadow-sm y shadow-md) para crear profundidad sin ensuciar el diseño, emulando la elevación física de los componentes.

3. Sistema Tipográfico

Utilizamos Inter como tipografía única por su excelente legibilidad en pantallas y su espaciado de glifos optimizado para interfaces de datos.

    Headlines (H1, H2): Pesos Bold (700). Utilizados para nombres de secciones y KPIs principales.

    Body Text: Tamaño base de 14px/16px con peso Medium (500) para asegurar que la información densa (tablas) sea escaneable.

    Labels y Metadata: Estilos en text-sm y colores grisáceos (text-slate-500) para jerarquía secundaria.

4. Layout General

La aplicación utiliza un layout de Sidebar Fija con un Área de Contenido Fluida.

    Sidebar: De tono claro pero con contraste estructural. Organiza la navegación principal, permitiendo cambios de contexto rápidos.

    Topbar: Minimalista, centrada en utilidades globales como búsqueda, notificaciones y perfil.

    Sistema de Grid: Estructura basada en columnas flexibles con gutters de 24px para mantener una alineación matemática perfecta.

5. Componentes UI

    Buttons: Tres estados claros (Default, Hover, Active). El botón primario usa el gradiente o color sólido violeta para máxima visibilidad.

    Tables: Filas con hover states sutiles. Alineación numérica a la derecha y texto a la izquierda para cumplir con estándares de contabilidad.

    Badges: Utilizados para estados (Paid, Pending, Overdue). Colores semánticos (Verde, Ámbar, Rojo) con fondos desaturados para no competir con el color primario.

    Cards: Contenedores de métricas con micro-gráficos integrados para visualización rápida de tendencias.

6. Dashboard UX: Arquitectura de Información

El Dashboard está diseñado bajo la técnica del "F-Pattern".

    KPIs Superiores: Las métricas de ingresos y proyectos ocupan la posición de mayor peso visual (arriba a la izquierda).

    Visualización de Datos: Los gráficos de barras y líneas ocupan el centro, permitiendo detectar anomalías en la facturación de un vistazo.

    Actividad Reciente: Ubicada en el lateral derecho para ofrecer contexto histórico sin interrumpir el flujo de las métricas principales.

7. CRM y Gestión de Clientes

La experiencia de gestión se basa en la edición contextual.

    Panel Lateral (Slide-over): En lugar de llevar al usuario a una pantalla nueva para editar un cliente, se utiliza un panel lateral. Esto mantiene el contexto de la tabla principal y acelera el flujo de trabajo.

    Filtros Inteligentes: Segmentación por "Tier" y "Status" para manejar carteras de clientes extensas con eficiencia.

8. Pipeline de Proyectos y Tareas

Inspirado en el sistema Kanban de Linear:

    Visualización de Estado: Cada tarjeta de tarea o proyecto tiene una barra de progreso visual.

    Priorización: Uso de iconos y etiquetas de color para diferenciar tareas urgentes de tareas secundarias.

    Drag & Drop Ready: El diseño prevé interacciones táctiles y de ratón para mover tareas entre columnas de estado.

9. Visualización de Datos

Los gráficos en ClientFlow evitan el "chart junk". 

    Simplicidad: Se eliminan ejes innecesarios y se utilizan tooltips para mostrar valores exactos al hacer hover.

    Consistencia de Color: El violeta representa datos reales ("Actual"), mientras que tonos desaturados representan proyecciones ("Projected").

10. Responsive Design

    Mobile: La sidebar se transforma en un menú "hamburger" colapsable. Las tablas se convierten en listas de tarjetas para optimizar el espacio vertical.

    Adaptabilidad: Los contenedores de métricas pasan de una fila de 4 a un grid de 2x2 en tablets, manteniendo la legibilidad de los números.

11. Animaciones y Microinteracciones

    Transiciones: Cambios de pantalla mediante fades suaves (200ms).

    Hover Effects: Elevación ligera de tarjetas y cambio de opacidad en botones para confirmar la interactividad.

    Loading States: Uso de skeletons que mantienen la estructura de la página mientras se cargan los datos, reduciendo la percepción de tiempo de espera.

12. Accesibilidad

    Contraste: Todos los textos cumplen con el estándar WCAG AA (mínimo 4.5:1).

    Target Sizes: Botones e inputs tienen un área clicable mínima de 44px para evitar errores de interacción.

    Jerarquía Semántica: Uso correcto de etiquetas HTML (h1-h6, main, nav) para navegación por teclado y lectores de pantalla.

13. Inspiraciones Visuales

    Linear: Por su manejo de la densidad de información y el uso de "dark mode" sutil.

    Stripe: Por la elegancia de sus gráficos y el layout de dashboard corporativo.

    Notion: Por la limpieza de los espacios y la tipografía aireada.

    Vercel: Por el uso de bordes finos y estética minimalista de alto contraste.

14. Conclusión

ClientFlow no es solo un CRM; es una extensión del flujo de trabajo del freelancer. El sistema de diseño "Precision Minimalist" logra un equilibrio entre una herramienta técnica potente y una interfaz amigable que no agota al usuario tras horas de uso. Cada decisión, desde el radio de los bordes hasta la paleta violeta, está enfocada en proyectar un entorno de trabajo premium y profesional.