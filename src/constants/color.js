const color = [
  '#B97CF4',
  '#68A6FB',
  '#FFCC21',
  '#72D00C',
  '#FB9F32',
];

let index = 0;
export const randomColor = (indexArgs) => {
  if (undefined !== indexArgs) {
    return color[indexArgs % color.length];
  }

  const currentColor = color[index];
  index += 1;
  if (color.length < index) {
    index = 0;
  }
  return currentColor;
};

export default color;
