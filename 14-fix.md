Error deployment

components/whiteboard.tsx(102,19): error TS2345: Argument of type '{ type: string; elements: readonly any[]; }' is not assignable to parameter of type 'Json'.
  Types of property 'elements' are incompatible.
    Type 'readonly any[]' is not assignable to type 'Json | undefined'.
      The type 'readonly any[]' is 'readonly' and cannot be assigned to the mutable type 'JsonArray'.
components/whiteboard.tsx(137,28): error TS7006: Parameter 'elements' implicitly has an 'any' type.
components/whiteboard.tsx(137,38): error TS7006: Parameter '_appState' implicitly has an 'any' type.
components/whiteboard.tsx(137,49): error TS7006: Parameter '_files' implicitly has an 'any' type.
Failed to type check.
Error: Command "npm run build" exited with 1