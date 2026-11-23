# StructuralGeoLab

**Learn structural geology by moving it.** An interactive website with 25 simulations covering folds, faults, strike & dip, geological maps and the forces that shape the crust.

## What's inside

- **9 levels**, each opening with a simulation, followed by short explanations and a 3-question check:
  1. Primary structures · 2. Stress, strain & depth · 3. Strike, dip & geological maps · 4. Folds · 5. Fold symmetry · 6. How folds form · 7. Faults · 8. Faults in depth · 9. Secondary structures
- **Simulation lab** with every simulation in one place (`/lab`), and a sidebar to jump between them
- **Into the Crust**, a scroll-driven journey from the surface to 30 km
- **3D simulations**: strike & dip, structure contours, the rule of Vs, a fold block you can erode, and faults with any rake
- **Fault simulations** from fault growth & linkage, through trishear folds, fault drag, fault-zone architecture and wells with repeated / missing section, to the Mohr circle & Anderson's faults
- A searchable glossary, progress saved on the device, and a layout that works on phones

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # geology maths tests
npm run build
```

Built with React, TypeScript, Vite, Tailwind CSS, three.js / react-three-fiber and Motion. Some interface components are adapted from [React Bits](https://github.com/DavidHDev/react-bits).

## Sources

Concepts and terminology follow H. Fossen, *Structural Geology* (Cambridge University Press) and its *Faults* and *Folding* e-modules. All text and graphics on the site are original. See the About page for the full list.

Sister project of [Campus GeoQuest](https://github.com/yashhhhapexxxx/CampusGeoQuest).
