/** 第 1 题：每条思路用情景数字算的那一步（纯函数，测试直接核对）。 */
import { q1 } from "./config";

const { ahead, arrive, serve, horizon, sample, payShare } = q1.scene;
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** 预测：horizon 分钟后队伍人数，以及那时排到队尾要等多久 */
export function predict() {
  const growth = arrive - serve;
  const later = ahead + growth * horizon;
  return { growth, later, wait: later / serve };
}

/** 优化：再开一个同样快的窗口后，每分钟净减少几人、多久消化完现在的队伍 */
export function optimize() {
  const served = serve * 2;
  const shrink = served - arrive;
  return { served, shrink, clear: shrink > 0 ? ahead / shrink : Infinity };
}

/** 验证：举例的掐表结果换算成每分钟 */
export function verify() {
  return { came: sample.came / sample.minutes, served: sample.served / sample.minutes };
}

/** 拆解：每份用时（秒），以及假设的刷卡用时占多少 */
export function analyze() {
  const perServing = 60 / serve;
  return { perServing, pay: payShare, rest: perServing - payShare };
}

/** 每条思路的“算一步”，一句话（数字全部由上面的函数给出）。 */
export function workedStep(id: string) {
  switch (id) {
    case "predict": {
      const p = predict();
      return `队伍每分钟长 ${arrive} − ${serve} = ${p.growth} 人。${horizon} 分钟后：${ahead} + ${p.growth} × ${horizon} = ${p.later} 人，那时排到队尾要等 ${p.later} ÷ ${serve} = ${fmt(p.wait)} 分钟。`;
    }
    case "optimize": {
      const o = optimize();
      return `两个窗口每分钟能打 ${o.served} 份，比来的 ${arrive} 人多，队伍每分钟短 ${o.shrink} 人：现在的 ${ahead} 人，${ahead} ÷ ${o.shrink} = ${fmt(o.clear)} 分钟就能消化掉。`;
    }
    case "verify": {
      const v = verify();
      return `比如掐表 ${sample.minutes} 分钟，数到来了 ${sample.came} 人、打走 ${sample.served} 份，就是每分钟约 ${fmt(v.came)} 人、${fmt(v.served)} 份——和“来 ${arrive} 打 ${serve}”差不多，模型可以放心用。`;
    }
    case "analyze": {
      const a = analyze();
      return `每分钟 ${serve} 份，就是每份 60 ÷ ${serve} = ${fmt(a.perServing)} 秒。假如其中刷卡就占 ${a.pay} 秒，改成扫码付款，可能比多开一个窗口还省事。`;
    }
    default:
      return "";
  }
}
