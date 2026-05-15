import {lib,game,ui,get,ai,_status} from '../../../noname.js'

const targetVersion = "1.11.1";
function isVersionGte(currentVer, requiredVer) {
	if (!currentVer || !requiredVer) return false;
	const cur = currentVer.split('.').map(Number);
	const req = requiredVer.split('.').map(Number);
	const maxLen = Math.max(cur.length, req.length);
	for (let i = 0; i < maxLen; i++) {
		const c = cur[i] || 0;
		const r = req[i] || 0;
		if (c > r) return true;
		if (c < r) return false;
	}
	return true;
}
const currentLibVersion = lib?.version || "0.0.0";

const block = (() => {
	const isGte1110 = isVersionGte(currentLibVersion, targetVersion);
	if (isGte1110) {
		return {
			// 武将信息
			gf_gx: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_gongxi", "gf_xiaoji"], noYjhj: true, },
			gf_zj: { sex: "male", group: "ge", hp: 2, maxHp: 3, hujia: 2, skills: ["gf_zhengjia", "gf_pojia"], noYjhj: true, },
			gf_sb: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_shanbu", "gf_shigui"], noYjhj: true, },
			gf_gb: { sex: "male", group: "ge", hp: 3, maxHp: 4, hujia: 5, skills: ["gf_gubu", "gf_huoran"], noYjhj: true, },
			gf_s: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_geshe", "gf_fenzhai"], noYjhj: true, },
			gf_gp: { sex: "male", group: "ge", hp: 1, maxHp: 1, hujia: 5, skills: ["gf_gupeng", "gf_mohe"], noYjhj: true, },
			gf_yf: { sex: "male", group: "ge", hp: 2, maxHp: 3, skills: ["gf_yufa", "gf_weidi"], noYjhj: true, },
			gf_sg: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_shanggu", "gf_bixian"], noYjhj: true, },
			gf_gf: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_gefu"], noYjhj: true, },
			gf_lb: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["cxm_shi"], noPool: true, },
			gf_ks: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gf_kushui", "gf_moli"], noYjhj: true, },
			gf_bs: { sex: "male", group: "ge", hp: 2, maxHp: 4, hujia: 2, skills: ["gf_boshan", "gf_zhengzhuang"], noYjhj: true, },
			gf_ts: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_taisui", "gf_zhensha"], noYjhj: true, },
			//gf_dj: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: [], isUnseen: true },
			gf_gh: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gf_gehun"], noYjhj: true, },
			gf_pg: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gf_tiemian", "gf_duanan"], noYjhj: true, },
			gf_phj: { sex: "male", group: "ge", hp: 3, maxHp: 4, hujia: 1, skills: ["gf_pinzhuang", "gf_pinzhuang_1"], noYjhj: true, },

			// 无职转生
			wzzs_bl: { sex: "male", group: "zhi", hp: 4, maxHp: 4, skills: ["wzzs_jianliu"] },
			wzzs_znb: { sex: "male", group: "zhi", hp: 5, maxHp: 5, skills: ["wzzs_guaili", "wzzs_jiangxin"], noYjhj: true, },
			wzzs_aesdd: { sex: "male", group: "zhi", hp: 4, maxHp: 4, skills: ["wzzs_longmen", "wzzs_jianzhen", "wzzs_douqi", "wzzs_dudang", "wzzs_shendao"], noYjhj: true, },
			wzzs_lqx: { sex: "female", group: "zhi", hp: 3, maxHp: 3, skills: ["wzzs_shuidan", "wzzs_jiyun"] },
			wzzs_klf: { sex: "male", group: "zhi", hp: 3, maxHp: 3, skills: ["wzzs_yiju", "wzzs_shenji"] },
			wzzs_alnlj: { sex: "female", group: "zhi", hp: 4, maxHp: 4, skills: ["wzzs_minren", "wzzs_benneng", "wzzs_mozhou"] },
			// wzzs_dx: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_duxin", "xinliegong"] },
			
			// 荼家
			//"cxm_zy": { sex: "male", group: "shu", hp: 2, maxHp: 3, skills: ["cxm_longdan", "cxm_jiuzhu", "cxm_chongzhen"] },
			cxm_lb: { sex: "male", group: "shu", hp: 4, maxHp: 4, skills: ["cxm_rende", "cxm_shenyi", "cxm_guying"], noYjhj: true, },
			cxm_th: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["cxm_juyi"] },
			cxm_llq: { sex: "female", group: "qun", hp: 4, maxHp: 4, skills: ["cxm_guowu", "cxm_zhuangrong"], noYjhj: true, },
			cxm_ty: { sex: "male", group: "shu", hp: 4, maxHp: 4, skills: ["cxm_youlong"], noYjhj: true, },
			cxm_tqa: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["cxm_lianji", "cxm_mousheng"], noYjhj: true, },
			cxm_ql: { sex: "female", group: "qun", hp: 3, maxHp: 5, skills: ["seh_yeying", "seh_mimeng", "seh_huanshi"], noYjhj: true, },
			cxm_dz: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["cxm_zhenbian", "cxm_hengzheng", "cxm_zhiquan"], noYjhj: true, },
			cxm_cy: { sex: "female", group: "wei", hp: 4, maxHp: 4, skills: ["cxm_lingren", "cxm_fujian"], noYjhj: true, },
			cxm_gh: { sex: "male", group: "wei", hp: 4, maxHp: 4, skills: ["cxm_jingce"], noYjhj: true, },
			cxm_tck: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["cxm_zhefu", "cxm_xici"], noYjhj: true, },
			cxm_zyu: { sex: "male", group: "wu", hp: 4, maxHp: 4, skills: ["cxm_yingzi", "cxm_fanjian"] },
			cxm_la: { sex: "male", group: "qun", hp: 4, maxHp: 5, hujia: 1, skills: ["cxm_wuwei", "cxm_shixiao"], noYjhj: true, },
			cxm_tj: { sex: "male", group: "qun", hp: 4, maxHp: 4, hujia: 0, skills: ["cxm_nishi", "cxm_anluan"] },
			//cxm_la: { sex: "male", group: "qun", hp: 4, maxHp: 5, hujia: 1, skills: ["gzb_kuangcai"], noYjhj: true, },
			cxm_yz: { sex: "male", group: "qun", hp: 4, maxHp: 4, hujia: 0, skills: ["cxm_daji", "cxm_lianxie"], noYjhj: true, },

			// 汝家
			tj_zzh: { sex: "female", group: "wei", hp: 3, maxHp: 4, skills: ["tj_jueqing", "tj_shangshi", "tj_xuanmu"], noYjhj: true, },
			tj_sr: { sex: "female", group: "wu", hp: 3, maxHp: 3, skills: ["cy_c", "cy_tongmu", "cy_tongxin"], noYjhj: true, },
			tj_lm: { sex: "male", group: "wu", hp: 4, maxHp: 4, skills: ["cy_gujiang", "cy_cuixian", "cy_wuce"], noYjhj: true, },

			// 鸽杂谈
			gzt_mkb: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["gzt_youlong", "gzt_gujian"] },
			gzt_bhx: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["gzt_kuaru", "gzt_bingxian"] },
			// gzt_bzy: { sex: "male", group: "shu", hp: 4, maxHp: 4, skills: ["gzt_longming", "gzhlb_aa"] },
			gzt_bzy: { sex: "male", group: "shu", hp: 4, maxHp: 4, skills: ["gzt_longming"] },
			gzt_lxx: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["gzt_weixing", "gzt_chudu"] },
			gzt_ggz: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["gzt_baihe", "gzt_xiyun"] },
			gzt_fl: { sex: "male", group: "qun", hp: 1, maxHp: 1, skills: ["gzt_zhuying", "gzt_zhihuo", "gzt_lidan"] },
			gzt_byzzq: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["gzt_zhiyin"] },
			gzt_xushao: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["gzt_pingjian"] },

			// 大明王朝
			dmwc_xj: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_zhoumi", "dmwc_chujian"] },
			dmwc_zjz: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_tiaobian", "dmwc_fuzheng"] },
			dmwc_gg: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_yudi", "dmwc_xunjin"] },
			dmwc_ys: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_bijian", "dmwc_guxian"] },
			dmwc_ysf: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_dangyuan", "dmwc_kuiji"] },
			dmwc_hzx: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_jiaokou", "dmwc_panfu"] },
			dmwc_hzx: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_jiaokou", "dmwc_panfu"] },
			dmwc_cyq: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_hengyi", "dmwc_huchu", "dmwc_zhitui"] },
			dmwc_hr: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_gangzheng", "dmwc_qinglv", "dmwc_guchen"] },
			dmwc_wyj: { sex: "male", group: "ming", hp: 4, maxHp: 4, skills: ["dmwc_xiangfu", "dmwc_cangshen"] },

			// 鸽子欢乐
			gzhlb_flo: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_fenglou", "gzhlb_zigong", "gzhlb_xiaozao"], isZhugong: true, },
			gzhlb_gezij: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_geshi", "gzhlb_linmo", "gzhlb_gezi"] },
			gzhlb_bg: { sex: "male", group: "ge", hp: 1, maxHp: 1, hujia: 1, skills: ["gzhlb_baige"], isUnseen: true },
			gzhlb_qifu: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_qifu"] },
			gzhlb_shenshi: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_shenshi"] },
			gzhlb_jl: { sex: "female", group: "ge", hp: 6, maxHp: 6, skills: ["gzhlb_jiuling"] },
			gzhlb_flzc: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["qbzc_biaohun"] },
			gzhlb_jx: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_liuxiang"] },
			gzhlb_xm: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_xuming"] },
			gzhlb_sm: { sex: "male", group: "ge", hp: 3, maxHp: 4, skills: ["gzhlb_suiming"], noYjhj: true, },
			gzhlb_gb: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_guibian", "gzhlb_shiya"], noYjhj: true, },
			gzhlb_Z: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_jiuding", "gzhlb_dingshi"], isUnseen: true, },
			gzhlb_ty: { sex: "male", group: "ge", hp: 4, maxHp: 6, skills: ["gzhlb_tanyu"] },
			gzhlb_yl: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_youli"] },
			gzhlb_ml: { sex: "male", group: "ge", hp: 4, maxHp: 6, skills: ["gzhlb_minglian", "gzhlb_kuangfei"] },
			gzhlb_kl: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_kuilei", "gzhlb_leizhen"], noYjhj: true, isUnseen: true, },
			gzhlb_yw: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_yiwei"] },
			gzhlb_hs: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_huashi", "gzhlb_sazi"] },
			gzhlb_B: { sex: "male", group: "ge", hp: 2, maxHp: 4, skills: ["gzhlb_chuanshu", "gzhlb_zheyi", "gzhlb_wangxiang"], noYjhj: true, },
			gzhlb_M: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_baimian"], },
			gzhlb_yll: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_yuelv"] },
			gzhlb_db: { sex: "male", group: "ge", hp: 5, maxHp: 5, skills: ["gzhlb_daobi"] },
			gzhlb_hz: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_houzou", "gzhlb_guojiu"] },
			gzhlb_st: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_shengtao", "gzhlb_shitan"] },
			gzhlb_cg: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_chegui"], noYjhj: true, },
			gzhlb_rm: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_rumo"], noYjhj: true, },
			gzhlb_fh: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_fenghuan", "gzhlb_jiuji"] },
			gzhlb_by: { sex: "male", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_baiyan", "gzhlb_ninglian"], isAiForbidden: true, noYjhj: true, },
			gzhlb_cy: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_chenyu", "gzhlb_yuduan"] },
			gzhlb_tx: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_tiaoxi", "gzhlb_yikong"] },
			gzhlb_mj: { sex: "female", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_mianju"] },
			gzhlb_hss: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_huishann","gzhlb_huimeng"] },
			gzhlb_dji: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_dunjian"] },
			gzhlb_yq: { sex: "male", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_yuanqing"] },
			gzhlb_ts: { sex: "female", group: "ge", hp: 3, maxHp: 3, skills: ["gzhlb_tianshi"] },
			gzhlb_jy: { sex: "female", group: "ge", hp: 4, maxHp: 4, skills: ["gzhlb_jieyuan"] },
			gzhlb_xr: { sex: "male", group: "ge", hp: 5, maxHp: 5, skills: ["gzhlb_xueren"] },

			// 赛尔号
			//"seh_gy": { sex: "male", group: "qun", hp: 5, maxHp: 5, skills: ["gy_douhun", "gy_wudao", "gy_suyuan"] },
			seh_saier_msdk: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_sj"], isUnseen: true },
			seh_saier_tqdj: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_lh"], isUnseen: true },//, noPool: true,
			seh_saier_yxlz: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_jb"], isUnseen: true },
			seh_saier_dd: { sex: "female", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_ms"], isUnseen: true },
			seh_saier_ly: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_ly"], isUnseen: true },
			seh_saier_gy: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["cxm_saier_wd"], isUnseen: true },
			seh_saier_hytz: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_hq"], isUnseen: true },
			seh_saier_cszy: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_cs"], isUnseen: true },
			seh_saier_dtzf: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_dz"], isUnseen: true },
			seh_saier_mmr: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["cxm_saier_fx"], isUnseen: true },
			seh_saier_fes: { sex: "male", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_qk"], isUnseen: true },
			seh_saier_aoly: { sex: "female", group: "qun", hp: 2, maxHp: 2, skills: ["cxm_saier_shij"], isUnseen: true },
			seh_xsr: { sex: "none", group: "qun", hp: 3, maxHp: 3, skills: ["cxm_saier"], noYjhj: true, },
			seh_hytz: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["seh_xinzhiqi", "seh_duoyi"], noYjhj: true, },
			seh_sls: { sex: "male", group: "qun", hp: 3, maxHp: 3, hujia: 1, skills: ["seh_mojun", "seh_hundun"], noYjhj: true, },
			seh_lmht: { sex: "male", group: "qun", hp: 4, maxHp: 6, hujia: 0, skills: ["seh_kongwang", "seh_wangshi"], noYjhj: true, },

			// 奥奇传说
			//"aqcs_cssl": { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["aqcs_zhigao", "aqcs_tianli"] },
			aqcs_ars: { sex: "male", group: "qun", hp: 1, maxHp: 4, hujia: 3, skills: ["aqcs_senluo", "aqcs_bitian"], noYjhj: true, },
			aqcs_frws: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["seh_yuanchu", "seh_shenhai"], noYjhj: true, },
			aqcs_lyjd: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["aqcs_tianjue", "aqcs_zhongyan"], noYjhj: true, },
			aqcs_gmw: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["aqcs_rishen", "aqcs_xuri"], noYjhj: true, },
			aqcs_gmw_hjsl: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["aqcs_huangjin"], isUnseen: true },
			aqcs_gmw_ydn: { sex: "female", group: "qun", hp: 3, maxHp: 3, hujia: 1, skills: ["aqcs_shengzhan"], isUnseen: true },
			aqcs_lzsz: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["aqcs_longyi", "aqcs_longquan"], noYjhj: true, },
			aqcs_lzsz_cylz: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["aqcs_yunmie"], isUnseen: true },
			aqcs_lzsz_cslz: { sex: "male", group: "qun", hp: 3, maxHp: 3, skills: ["aqcs_xingyan"], isUnseen: true },

			// 公主连结
			gzlj_qiunai: { sex: "female", group: "shu", hp: 4, maxHp: 4, skills: ["gzlj_qianjin", "gzlj_xingshang"] },

			// 实验体
			a_aerhao: { sex: "male", group: "qun", hp: 2, maxHp: 4, hujia: 2, skills: ["erhao", "eryi"], noPool: true, },
			a_ayihao: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["lanzheng"], noPool: true, },
			a_asanhao: { sex: "female", group: "qun", hp: 2, maxHp: 2, hujia: 1, skills: ["sanhao", "sanyi", "saner"], noPool: true, },
			a_berhao: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["erer"], noPool: true, },
			a_cerhao: { sex: "male", group: "qun", hp: 2, maxHp: 4, hujia: 2, skills: ["erhao"], noPool: true, },
			a_asihao: { sex: "male", group: "qun", hp: 6, maxHp: 6, skills: ["sihao"], noPool: true, },
			a_awuhao: { sex: "male", group: "qun", hp: 4, maxHp: 4, skills: ["wuhao", "awuyi"], noPool: true, },
		};
	} else {
		return {
			//鸽府
			"gf_gx": ["male", "ge", "3/3/0", ["gf_gongxi", "gf_xiaoji"], ["noYjhj"]],
			"gf_zj": ["male", "ge", "2/3/2", ["gf_zhengjia", "gf_pojia"], ["noYjhj"]],
			"gf_sb": ["male", "ge", "3/3/0", ["gf_shanbu", "gf_shigui"], ["noYjhj"]],
			"gf_gb": ["male", "ge", "3/4/5", ["gf_gubu", "gf_huoran"], ["noYjhj"]],
			"gf_s": ["male", "ge", "3/3/0", ["gf_geshe", "gf_fenzhai"], ["noYjhj"]],
			"gf_gp": ["male", "ge", "1/1/5", ["gf_gupeng", "gf_mohe"], ["noYjhj"]],
			"gf_yf": ["male", "ge", "2/3/0", ["gf_yufa", "gf_weidi"], ["noYjhj"]],
			"gf_sg": ["male", "ge", "3/3/0", ["gf_shanggu", "gf_bixian"], ["noYjhj"]],
			"gf_gf": ["male", "ge", "3/3/0", ["gf_gefu"], ["noYjhj"]],
			"gf_lb": ["male", "ge", "4/4/0", ["cxm_shi"], ["noPool"]],
			"gf_ks": ["male", "ge", "4/4/0", ["gf_kushui", "gf_moli"], ["noYjhj"]],
			"gf_bs": ["male", "ge", "2/4/2", ["gf_boshan", "gf_zhengzhuang"], ["noYjhj"]],
			"gf_ts": ["male", "ge", "3/3/0", ["gf_taisui", "gf_zhensha"], ["noYjhj"]],
			"gf_gh": ["male", "ge", "3/3/0", ["gf_gehun"], ["noYjhj"]],
			"gf_pg": ["male", "ge", "4/4/0", ["gf_tiemian", "gf_duanan"], ["noYjhj"]],
			"gf_phj": ["male", "ge", "3/4/1", ["gf_pinzhuang", "gf_pinzhuang_1"], ["noYjhj"]],

			// 无职转生
			"wzzs_bl": ["male", "zhi", "4/4/0", ["wzzs_jianliu"], []],
			"wzzs_znb": ["male", "zhi", "5/5/0", ["wzzs_guaili", "wzzs_jiangxin"], ["noYjhj"]],
			"wzzs_aesdd": ["male", "zhi", "4/4/0", ["wzzs_longmen", "wzzs_jianzhen", "wzzs_douqi", "wzzs_dudang", "wzzs_shendao"], ["noYjhj"]],
			"wzzs_lqx": ["female", "zhi", "3/3/0", ["wzzs_shuidan", "wzzs_jiyun"], []],
			"wzzs_klf": ["male", "zhi", "3/3/0", ["wzzs_yiju", "wzzs_shenji"], []],
			"wzzs_alnlj": ["female", "zhi", "4/4/0", ["wzzs_minren", "wzzs_benneng", "wzzs_mozhou"], []],

			// 荼家
			"cxm_lb": ["male", "shu", "4/4/0", ["cxm_rende", "cxm_shenyi", "cxm_guying"], ["noYjhj"]],
			"cxm_th": ["male", "qun", "4/4/0", ["cxm_juyi"], []],
			"cxm_llq": ["female", "qun", "4/4/0", ["cxm_guowu", "cxm_zhuangrong"], ["noYjhj"]],
			"cxm_ty": ["male", "shu", "4/4/0", ["cxm_youlong"], ["noYjhj"]],
			"cxm_tqa": ["male", "qun", "4/4/0", ["cxm_lianji", "cxm_mousheng"], ["noYjhj"]],
			"cxm_ql": ["female", "qun", "3/5/0", ["seh_yeying", "seh_mimeng", "seh_huanshi"], ["noYjhj"]],
			"cxm_dz": ["male", "qun", "4/4/0", ["cxm_zhenbian", "cxm_hengzheng", "cxm_zhiquan"], ["noYjhj"]],
			"cxm_cy": ["female", "wei", "4/4/0", ["cxm_lingren", "cxm_fujian"], ["noYjhj"]],
			"cxm_gh": ["male", "wei", "4/4/0", ["cxm_jingce"], ["noYjhj"]],
			"cxm_tck": ["male", "qun", "4/4/0", ["cxm_zhefu", "cxm_xici"], ["noYjhj"]],
			"cxm_zyu": ["male", "wu", "4/4/0", ["cxm_yingzi", "cxm_fanjian"], []],
			"cxm_la": ["male", "wu", "4/5/1", ["cxm_wuwei", "cxm_shixiao"], []],
			"cxm_tj": ["male", "qun", "4/4/0", ["cxm_nishi", "cxm_anluan"], []],
			"cxm_yz": ["male", "qun", "4/4/0", ["cxm_daji", "cxm_lianxie"], ["noYjhj"]],
			
			// 汝家
			"tj_zzh": ["female", "wei", "3/4/0", ["tj_jueqing", "tj_shangshi", "tj_xuanmu"], ["noYjhj"]],
			"tj_sr": ["female", "wu", "3/3/0", ["cy_c", "cy_tongmu", "cy_tongxin"], ["noYjhj"]],
			"tj_lm": ["male", "wu", "4/4/0", ["cy_gujiang", "cy_cuixian", "cy_wuce"], ["noYjhj"]],

			// 鸽杂谈
			"gzt_mkb": ["male", "qun", "4/4/0", ["gzt_youlong", "gzt_gujian"], []],
			"gzt_bhx": ["male", "qun", "4/4/0", ["gzt_kuaru", "gzt_bingxian"], []],

			// 鸽子欢乐
			"gzhlb_flo": ["male", "ge", "4/4/0", ["gzhlb_fenglou", "gzhlb_zigong", "gzhlb_xiaozao"], []],
			"gzhlb_gezij": ["male", "ge", "3/3/0", ["gzhlb_geshi", "gzhlb_linmo", "gzhlb_gezi"], []],
			"gzhlb_bg": ["male", "ge", "1/1/1", ["gzhlb_baige"], ["unseen"]],
			"gzhlb_qifu": ["male", "ge", "3/3/0", ["gzhlb_qifu"], []],
			"gzhlb_shenshi": ["male", "ge", "3/3/0", ["gzhlb_shenshi"], []],
			"gzhlb_jl": ["female", "ge", "6/6/0", ["gzhlb_jiuling"], []],
			"gzhlb_flzc": ["male", "ge", "3/3/0", ["qbzc_biaohun"], []],
			"gzhlb_jx": ["female", "ge", "3/3/0", ["gzhlb_liuxiang"], []],
			"gzhlb_xm": ["male", "ge", "3/3/0", ["gzhlb_xuming"], []],
			"gzhlb_sm": ["male", "ge", "3/4/0", ["gzhlb_suiming"], ["noYjhj"]],
			"gzhlb_gb": ["male", "ge", "3/3/0", ["gzhlb_guibian", "gzhlb_shiya"], ["noYjhj"]],
			"gzhlb_Z": ["male", "ge", "4/4/0", ["gzhlb_jiuding", "gzhlb_dingshi"], ["noYjhj", "unseen"]],
			"gzhlb_ty": ["male", "ge", "4/6/0", ["gzhlb_tanyu"], []],
			"gzhlb_yl": ["male", "ge", "4/4/0", ["gzhlb_youli"], []],
			"gzhlb_ml": ["male", "ge", "4/6/0", ["gzhlb_minglian", "gzhlb_kuangfei"], []],
			"gzhlb_kl": ["female", "ge", "3/3/0", ["gzhlb_kuilei", "gzhlb_leizhen"], ["noYjhj"]],
			"gzhlb_yw": ["female", "ge", "3/3/0", ["gzhlb_yiwei"], []],
			"gzhlb_hs": ["female", "ge", "3/3/0", ["gzhlb_huashi", "gzhlb_sazi"], []],
			"gzhlb_B": ["male", "ge", "2/4/0", ["gzhlb_chuanshu", "gzhlb_zheyi", "gzhlb_wangxiang"], ["noYjhj"]],
			"gzhlb_yll": ["female", "ge", "3/3/0", ["gzhlb_yuelv"], []],
			"gzhlb_db": ["male", "ge", "5/5/0", ["gzhlb_daobi"], []],
			"gzhlb_hz": ["male", "ge", "4/4/0", ["gzhlb_houzou", "gzhlb_guojiu"], []],
			"gzhlb_st": ["male", "ge", "4/4/0", ["gzhlb_shengtao", "gzhlb_shitan"], []],
			"gzhlb_cg": ["male", "ge", "4/4/0", ["gzhlb_chegui"], ["noYjhj"]],
			"gzhlb_rm": ["male", "ge", "4/4/0", ["gzhlb_rumo"], ["noYjhj"]],
			"gzhlb_fh": ["male", "ge", "4/4/0", ["gzhlb_fenghuan", "gzhlb_jiuji"], []],
			"gzhlb_by": ["male", "ge", "3/3/0", ["gzhlb_baiyan", "gzhlb_ninglian"], ["forbidai", "noYjhj"]],
			"gzhlb_cy": ["male", "ge", "4/4/0", ["gzhlb_chenyu", "gzhlb_yuduan"], []],
			"gzhlb_tx": ["male", "ge", "4/4/0", ["gzhlb_tiaoxi", "gzhlb_yikong"], ["noYjhj"]],
			"gzhlb_mj": ["male", "ge", "4/4/0", ["gzhlb_mianju"], []],
			"gzhlb_hss": ["male", "ge", "4/4/0", ["gzhlb_huishann","gzhlb_huimeng"], []],
			"gzhlb_dji": ["male", "ge", "4/4/0", ["gzhlb_dunjian"], []],
			"gzhlb_yq": ["male", "ge", "4/4/0", ["gzhlb_yuanqing"], []],
			"gzhlb_ts": ["male", "ge", "3/3/0", ["gzhlb_tianshi"], []],
			"gzhlb_jy": ["male", "ge", "4/4/0", ["gzhlb_jieyuan"], []],

			// 赛尔号
			"seh_saier_msdk": ["male", "qun", "2/2/0", ["cxm_saier_sj"], ["unseen"]],
			"seh_saier_tqdj": ["male", "qun", "2/2/0", ["cxm_saier_lh"], ["unseen"]],
			"seh_saier_yxlz": ["male", "qun", "2/2/0", ["cxm_saier_jb"], ["unseen"]],
			"seh_saier_dd": ["female", "qun", "2/2/0", ["cxm_saier_ms"], ["unseen"]],
			"seh_saier_ly": ["male", "qun", "2/2/0", ["cxm_saier_ly"], ["unseen"]],
			"seh_saier_gy": ["male", "qun", "3/3/0", ["cxm_saier_wd"], ["unseen"]],
			"seh_saier_hytz": ["male", "qun", "2/2/0", ["cxm_saier_hq"], ["unseen"]],
			"seh_saier_cszy": ["male", "qun", "2/2/0", ["cxm_saier_cs"], ["unseen"]],
			"seh_saier_dtzf": ["male", "qun", "2/2/0", ["cxm_saier_dz"], ["unseen"]],
			"seh_saier_mmr": ["male", "qun", "3/3/0", ["cxm_saier_fx"], ["unseen"]],
			"seh_saier_fes": ["male", "qun", "2/2/0", ["cxm_saier_qk"], ["unseen"]],
			"seh_saier_aoly": ["female", "qun", "2/2/0", ["cxm_saier_shij"], ["unseen"]],
			"seh_xsr": ["none", "qun", "3/3/0", ["cxm_saier"], ["noYjhj"]],
			"seh_hytz": ["male", "qun", "4/4/0", ["seh_xinzhiqi", "seh_duoyi"], ["noYjhj"]],
			"seh_sls": ["male", "qun", "3/3/1", ["seh_mojun", "seh_hundun"], ["noYjhj"]],
			"seh_lmht": ["male", "qun", "4/6/0", ["seh_kongwang", "seh_wangshi"], ["noYjhj"]],

			// 奥奇传说
			"aqcs_ars": ["male", "qun", "1/4/3", ["aqcs_senluo", "aqcs_bitian"], ["noYjhj"]],
			"aqcs_frws": ["male", "qun", "4/4/0", ["seh_yuanchu", "seh_shenhai"], ["noYjhj"]],
			"aqcs_lyjd": ["male", "qun", "4/4/0", ["aqcs_tianjue", "aqcs_zhongyan"], ["noYjhj"]],
			"aqcs_gmw": ["male", "qun", "4/4/0", ["aqcs_rishen", "aqcs_xuri"], ["noYjhj"]],
			"aqcs_gmw_hjsl": ["male", "qun", "4/4/0", ["aqcs_shengzhan"], ["unseen"]],
			"aqcs_gmw_ydn": ["female", "qun", "3/3/1", ["aqcs_shengzhan"], ["unseen"]],

			// 公主连结
			"gzlj_qiunai": ["female", "shu", "4/4/0", ["gzlj_qianjin", "gzlj_xingshang"], []],

			// 实验体
			"a_aerhao": ["male", "qun", "2/4/2", ["erhao", "eryi"], ["noPool"]],
			"a_ayihao": ["male", "qun", "4/4/0", ["lanzheng"], ["noPool"]],
			"a_asanhao": ["female", "qun", "2/2/1", ["sanhao", "sanyi", "saner"], ["noPool"]],
			"a_berhao": ["male", "qun", "4/4/0", ["erer"], ["noPool"]],
			"a_cerhao": ["male", "qun", "2/4/2", ["erhao"], ["noPool"]],
			"a_asihao": ["male", "qun", "6/6/0", ["sihao"], ["noPool"]],
			"a_awuhao": ["male", "qun", "4/4/0", ["wuhao", "awuyi"], ["noPool"]]
		};
	}
})();
export const characterData=block;

