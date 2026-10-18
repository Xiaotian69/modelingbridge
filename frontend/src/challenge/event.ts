/**
 * 招新活动开关、协会名称与群号：小游戏（/challenge）和主站招新公告共用这一份。
 * 单独成文件，首页引用它时不会把小游戏的题目内容打进首页的包。
 * 换群号、开关活动只改这里；小游戏的题目和文案仍在 config.ts。
 */

/**
 * 活动开关与联系方式。
 * - active：招新进行中。改成 false 后，小游戏结果页的“加入协会”变“关注协会”，/challenge 链接继续可用；
 *   主站首页的招新公告整条隐藏。
 * - lottery：摊位抽奖确认开展后才改成 true；为 false 时页面上不出现任何抽奖字样。
 */
export const event = {
  active: true,
  lottery: false,
  societyName: "财大数学建模协会",
  /** 结果页给的是招新群（不是协会大群）：先进招新群了解、报名，加入协会后再进协会群 */
  qqGroup: "566983524",
  groupName: "QQ 招新群",
  joinNote: "先进招新群，了解协会、报名加入。",
  /** 开始页顶部小字 */
  activeNote: "财大数学建模协会 · 招新进行中",
  lotteryNote: "财大数学建模协会 · 测完到摊位凭结果页抽奖",
  /** 结果页“截图保存”后面接的话（仅 lottery 为 true 时显示） */
  lotteryHint: "，到招新摊位出示就能抽奖",
  /** 活动结束后，结果页联系卡片的说明 */
  afterNote: "招新已结束，欢迎进群了解协会的后续活动。",
};

/**
 * 进入 /challenge 的渠道：只认这几个值，其他一律记为 direct。
 * poster / booth / flyer / group 是线下二维码和群里转发；site 是主站首页的招新公告。
 */
export const SOURCES = ["poster", "booth", "flyer", "group", "site"] as const;
