import { describe, expect, it } from "vitest";
import { courseKey, professorKey } from "../names";

describe("professorKey", () => {
  it("ignora títulos, tildes, mayúsculas y orden", () => {
    const a = professorKey("Mg. Rosa Quispe Huamán");
    expect(professorKey("QUISPE HUAMAN, ROSA")).toBe(a);
    expect(professorKey("rosa quispe huaman")).toBe(a);
    expect(professorKey("Dra. Huamán Quispe Rosa")).toBe(a);
  });
  it("distingue personas distintas", () => {
    expect(professorKey("Rosa Quispe Huamán")).not.toBe(professorKey("Rosa Quispe Lazo"));
  });
});

describe("courseKey", () => {
  it("equipara romanos, tildes y conectores", () => {
    expect(courseKey("Matemática II")).toBe(courseKey("MATEMATICA 2"));
    expect(courseKey("Introducción A La Vida Universitaria")).toBe(courseKey("Introducción a la vida universitaria"));
    expect(courseKey("Inglés I")).toBe(courseKey("Inglés 1"));
  });
  it("no mezcla cursos distintos", () => {
    expect(courseKey("Base de Datos")).not.toBe(courseKey("Base de Datos 2"));
  });
});
