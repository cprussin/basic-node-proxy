{
  nodejs ? "10.15.3",
  yarn ? "1.12.3",
  nixjs ? fetchTarball "https://github.com/cprussin/nixjs/tarball/release-19.03",
  nixpkgs ? <nixpkgs>
}:

let
  nixjs-overlay = import nixjs { inherit nodejs yarn; };
  pkgs = import nixpkgs { overlays = [ nixjs-overlay ]; };
in

pkgs.mkShell {
  buildInputs = [
    pkgs.git
    pkgs.nodejs
    pkgs.yarn
  ];
}
