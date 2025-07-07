import { int } from '../../../define';

export class Descartes {
  public static run(
    dimvalue: string[][],
    result: string[],
    layer: int,
    curstring: string,
  ): void {
    let num: int = 0;
    if (layer < dimvalue.length - 1) {
      if (dimvalue[layer].length == 0) {
        Descartes.run(dimvalue, result, layer + 1, curstring);
      } else {
        for (num = 0; num < dimvalue[layer].length; num++) {
          let builder: string = '';
          builder += curstring;
          builder += dimvalue[layer][num];
          Descartes.run(dimvalue, result, layer + 1, builder.toString());
        }
      }
    } else if (layer == dimvalue.length - 1) {
      if (dimvalue[layer].length == 0) {
        result.push(curstring);
      } else {
        for (num = 0; num < dimvalue[layer].length; num++) {
          result.push(curstring + dimvalue[layer][num]);
        }
      }
    }
  }
}
