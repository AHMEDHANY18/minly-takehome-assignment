import { extractHashtags } from "../utilities/extractHashtags";

describe("extractHashtags", () => {
  it("extracts hashtags from text", () => {
    expect(extractHashtags("hello #world this is #cool")).toEqual([
      "world",
      "cool",
    ]);
  });

  it("lowercases tags", () => {
    expect(extractHashtags("#Foo #BAR")).toEqual(["foo", "bar"]);
  });

  it("dedupes tags (case-insensitively)", () => {
    expect(extractHashtags("#foo #Foo #FOO")).toEqual(["foo"]);
  });

  it("supports unicode letters (e.g. Arabic) and underscores/digits", () => {
    expect(extractHashtags("#مرحبا #tag_1 #2024")).toEqual([
      "مرحبا",
      "tag_1",
      "2024",
    ]);
  });

  it("returns [] for empty / null / undefined / no-hashtag input", () => {
    expect(extractHashtags("")).toEqual([]);
    expect(extractHashtags(null)).toEqual([]);
    expect(extractHashtags(undefined)).toEqual([]);
    expect(extractHashtags("no tags here")).toEqual([]);
  });

  it("stops at punctuation", () => {
    expect(extractHashtags("#hello, world")).toEqual(["hello"]);
  });
});
