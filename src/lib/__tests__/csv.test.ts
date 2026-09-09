import { describe, it, expect } from "vitest";
import { detectDelimiter, parseCsv, mapHeaders } from "../csv";

describe("detectDelimiter", () => {
  it("detects comma delimiter", () => {
    expect(detectDelimiter("name,email,phone")).toBe(",");
  });

  it("detects semicolon delimiter", () => {
    expect(detectDelimiter("name;email;phone")).toBe(";");
  });

  it("detects tab delimiter", () => {
    expect(detectDelimiter("name\temail\tphone")).toBe("\t");
  });

  it("detects comma in quoted fields", () => {
    expect(detectDelimiter('"John, Jr",email,phone')).toBe(",");
  });

  it("defaults to comma when equal counts", () => {
    expect(detectDelimiter("a,b;c")).toBe(",");
  });
});

describe("parseCsv", () => {
  it("parses simple comma-separated values", () => {
    const result = parseCsv("name,email\nJohn,john@test.com\nJane,jane@test.com");
    expect(result).toEqual([
      ["name", "email"],
      ["John", "john@test.com"],
      ["Jane", "jane@test.com"],
    ]);
  });

  it("parses quoted fields with commas", () => {
    const result = parseCsv('name,address\nJohn,"123 Main St, Apt 4"');
    expect(result).toEqual([
      ["name", "address"],
      ["John", "123 Main St, Apt 4"],
    ]);
  });

  it("handles escaped quotes", () => {
    const result = parseCsv('name,note\nJohn,"He said ""hello"""');
    expect(result).toEqual([
      ["name", "note"],
      ["John", 'He said "hello"'],
    ]);
  });

  it("handles CRLF line endings", () => {
    const result = parseCsv("name,email\r\nJohn,john@test.com");
    expect(result).toEqual([
      ["name", "email"],
      ["John", "john@test.com"],
    ]);
  });

  it("strips UTF-8 BOM", () => {
    const result = parseCsv("\uFEFFname,email\nJohn,john@test.com");
    expect(result).toEqual([
      ["name", "email"],
      ["John", "john@test.com"],
    ]);
  });

  it("filters out empty rows", () => {
    const result = parseCsv("name,email\n\nJohn,john@test.com\n\n");
    expect(result).toEqual([
      ["name", "email"],
      ["John", "john@test.com"],
    ]);
  });

  it("handles semicolon delimiter", () => {
    const result = parseCsv("name;email\nJohn;john@test.com", ";");
    expect(result).toEqual([
      ["name", "email"],
      ["John", "john@test.com"],
    ]);
  });

  it("handles empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("   ")).toEqual([]);
  });
});

describe("mapHeaders", () => {
  it("maps standard header names", () => {
    const result = mapHeaders(["Name", "Email", "Phone", "Website"]);
    expect(result).toEqual(["name", "email", "phone", "website"]);
  });

  it("maps alias header names", () => {
    const result = mapHeaders(["Business", "E Mail", "Telephone", "URL"]);
    expect(result).toEqual(["name", "email", "phone", "website"]);
  });

  it("returns null for unrecognized headers", () => {
    const result = mapHeaders(["Name", "CustomField", "Another"]);
    expect(result).toEqual(["name", null, null]);
  });

  it("handles case-insensitive matching", () => {
    const result = mapHeaders(["NAME", "email", "Phone"]);
    expect(result).toEqual(["name", "email", "phone"]);
  });

  it("handles headers with underscores and hyphens", () => {
    const result = mapHeaders(["business_name", "phone_number", "email_address"]);
    expect(result).toEqual(["name", "phone", "email"]);
  });
});
