import {lib,game,ui,get,ai,_status} from '../../../noname.js'
let block={//武将评级
    A:[
        "gf_lb", "gf_gf",
        "wzzs_alnlj",
        "cxm_th", "cxm_gh",
        "tj_lm",
        "gzhlb_bg", "gzhlb_qifu", "gzhlb_xm", "gzhlb_M", "gzhlb_db", "gzhlb_cg", "gzhlb_mj", "gzhlb_hss", "gzhlb_dji", "gzhlb_jy", "gzhlb_xr",
        "seh_saier_msdk", "seh_saier_tqdj", "seh_saier_yxlz", "seh_saier_dd", "seh_saier_ly", "seh_saier_gy",
        "aqcs_lzsz_cslz",
        "gzlj_qiunai",
        "a_cerhao"
    ],
    S:[
        "gf_gx", "gf_ks", "gf_gb", "gf_phj",
        "wzzs_bl", "wzzs_lqx", "wzzs_klf",
        "cxm_llq", "cxm_ty", "cxm_tqa", "cxm_ql", "cxm_cy", "cxm_tck", "cxm_zyu", "cxm_la", "cxm_tj", "cxm_yz",
        "tj_sr",
        "gzt_lxx", "gzt_gl", "gzt_fl",
        "dmwc_xj", "dmwc_zjz", "dmwc_ysf", "dmwc_hzx", "dmwc_cyq", "dmwc_hr",
        "gzhlb_ty", "gzhlb_yl", "gzhlb_yw", "gzhlb_hs", "gzhlb_shenshi", "gzhlb_yll", "gzhlb_hz", "gzhlb_st", "gzhlb_fh", "gzhlb_by", "gzhlb_cy", "gzhlb_yq", "gzhlb_ts",
        "aqcs_ars", "aqcs_gmw_hjsl", "aqcs_gmw_ydn", "aqcs_lzsz_cylz",
        "a_ayihao", "a_berhao"
    ],
    SS:[
        "gf_zj", "gf_sb", "gf_s", "gf_gp", "gf_sg", "gf_pg", "gf_bs", "gf_ts", "gf_yf", 
        "wzzs_znb",
        "cxm_dz", "cxm_lb",
        "tj_zzh",
        "gzt_mkb", "gzt_bhx", "gzt_ggz", "gzt_byzzq",
        "dmwc_gg", "dmwc_wyj", "dmwc_ys",
        "gzhlb_Z", "gzhlb_sm", "gzhlb_jx", "gzhlb_flo", "gzhlb_gezij", "gzhlb_rm", "gzhlb_flzc", "gzhlb_gb", "gzhlb_ml", "gzhlb_kl", "gzhlb_B", "gzhlb_tx",
        "seh_lmht", "seh_hytz", "seh_sls", "seh_saier_cszy", "seh_saier_dtzf", "seh_saier_mmr", "seh_saier_fes", "seh_saier_aoly",
        "aqcs_frws", "aqcs_gmw", "aqcs_lzsz",
        "a_aerhao", "a_asanhao", "a_asihao"
    ],
    SSS:[
        "gf_gh",
        "wzzs_aesdd",
        "gzt_bzy", "gzt_xushao",
        "gzhlb_jl", 
        "seh_xsr", 
        "aqcs_lyjd",
        "a_awuhao"
    ]
};
export const characterRank=block;