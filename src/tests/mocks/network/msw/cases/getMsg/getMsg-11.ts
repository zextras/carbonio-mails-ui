/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createFakeIdentity } from '../../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';

/**
 * Email with a table and a link
 */
const identity1 = createFakeIdentity();
const identity2 = createFakeIdentity();
const identity3 = createFakeIdentity();

export const getMsgResult = {
	Header: {
		context: {
			session: {
				id: '1230601',
				_content: '1230601'
			},
			change: {
				token: 101679
			},
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 28965,
					d: 1670846272000,
					l: 'a79fa996-e90e-4f04-97c4-c84209bb8277:1091',
					cid: 'a79fa996-e90e-4f04-97c4-c84209bb8277:-1411',
					f: 'w',
					rev: 4261,
					id: '11',
					fr: `Reminder to Make Appointment Selection ${identity3.lastName} ® Schedule an Interaction Dear ${identity1.firstName}, This is a final courtesy reminder regarding your request for a ...`,
					e: [
						{
							a: identity3.email,
							d: identity3.firstName,
							p: identity3.fullName,
							t: 'f'
						},
						{
							a: identity2.email,
							d: identity2.firstName,
							p: identity2.fullName,
							t: 't'
						},
						{
							a: identity1.email,
							d: 'ps',
							t: 't'
						},
						{
							a: identity1.email,
							d: identity1.firstName,
							p: identity1.fullName,
							t: 'rf'
						}
					],
					su: `${identity3.lastName} - (Ref# 15334464) - Review of Document "Market Guide for Email Security 2022`,
					mid: '<202212081724.2B8GoA9p060112@pps.reinject>',
					sd: 1670520254000,
					rd: 1670846271000,
					mp: [
						{
							part: '1',
							ct: 'text/html',
							s: 17514,
							body: true,
							content: `\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title></title><style>/*<![CDATA[*/*#outlook a {\n\tpadding: 0;\n}\n*.ReadMsgBody {\n\twidth: 100.0%;\n}\n*.ExternalClass {\n\twidth: 100.0%;\n}\n*.ExternalClass, *.ExternalClass p, *.ExternalClass span, *.ExternalClass font, *.ExternalClass td, *.ExternalClass div {\n\tline-height: 100.0%;\n}\nbody, table, td, p, a, li, blockquote {\n}\n* {\n}\ntable, td {\n}\nimg {\n}\n* {\n}\nbody {\n\tmargin: 0;\n\tpadding: 0;\n}\nimg {\n\tborder: 0;\n\theight: auto;\n\tline-height: 100.0%;\n\toutline: none;\n\ttext-decoration: none;\n}\ntable {\n\tborder-collapse: collapse;\n}\nbody, *#bodyTable, *#bodyCell {\n\theight: 100.0%;\n\tmargin: 0;\n\tpadding: 0;\n}\nbody, *#bodyTable {\n\twidth: 100.0%;\n}\n*#bodyCell {\n\tpadding: 45.0px 15.0px 45.0px 15.0px;\n}\na {\n\ttext-decoration: none;\n\tcolor: rgb(0,82,214);\n}\np {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tcolor: rgb(0,0,0);\n}\n*#templateHeader {\n\tbackground-color: rgb(0,40,86);\n}\n*.headerContent {\n\tbackground-color: rgb(0,40,86);\n\tfont-family: Arial , sans-serif;\n\tfont-size: 20.0px;\n\tfont-weight: bold;\n\tline-height: 100.0%;\n\tpadding: 10.0px 10.0px 10.0px 20.0px;\n\ttext-align: left;\n\tvertical-align: middle;\n}\n*.headerContentTable {\n\twidth: 100.0%;\n}\n*.headerTitle {\n\twidth: 181.0px;\n\theight: 24.0px;\n\tleft: 293.0px;\n\ttop: 83.0px;\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: bold;\n\tfont-size: 16.0px;\n\tline-height: 24.0px;\n\tcolor: rgb(255,255,255);\n}\n*.headerContent a:link, *.headerContent a:visited, *.headerContent a *.yshortcuts {\n\tcolor: rgb(65,112,143);\n\tfont-weight: bold;\n\ttext-decoration: none;\n}\n*.mask {\n\tbackground: rgb(6,196,176);\n\twidth: 7.0px;\n\theight: 55.0px;\n}\n*.calIcon {\n\tpadding-right: 10.0px;\n}\n*.templateBody {\n\tborder-top: 1.0px solid rgb(245,245,245);\n\tfont-family: Arial;\n\tmax-width: 700.0px;\n\tfont-size: 14.0px;\n\tfont-weight: 400;\n\tline-height: 24.0px;\n}\n*.instructionBody {\n\tborder-top: 1.0px solid rgb(245,245,245);\n\tfont-family: Arial;\n\tmax-width: 580.0px;\n\tfont-size: 14.0px;\n\tfont-weight: 400;\n\tline-height: 24.0px;\n}\n*.dummyTdHeight10px {\n\theight: 10.0px;\n}\n*.dummyTdHeight20px {\n\theight: 20.0px;\n}\n*.meetingTitleTd {\n\tbackground: rgb(6,196,176);\n\theight: 55.0px;\n\ttext-align: center;\n}\n*.meetingTitleText {\n\tfont-family: Arial , sans-serif;\n\tfont-size: 24.0px;\n\tcolor: rgb(255,255,255);\n\tfont-weight: bold;\n}\n*.whiteBox {\n\tbackground-color: white;\n\tpadding: 20.0px 25.0px 0.0px 25.0px;\n}\n*.whiteBoxNoTopMargin {\n\tbackground-color: white;\n\tpadding: 0.0px 25.0px 0.0px 25.0px;\n}\n*.whiteBoxTopMargin10Px {\n\tbackground-color: white;\n\tpadding: 10.0px 25.0px 0.0px 25.0px;\n}\n*.whiteBoxDummyTdHeight10px {\n\tbackground-color: white;\n\tpadding: 0.0px 25.0px 0.0px 25.0px;\n\theight: 10.0px;\n}\n*.whiteBoxDummyTdHeight20px {\n\tbackground-color: white;\n\tpadding: 0.0px 25.0px 0.0px 25.0px;\n\theight: 20.0px;\n}\n*.expertIcon {\n\tpadding-left: 10.0px;\n\tmargin-top: 10.0px;\n\twidth: 24.0px;\n\theight: 24.0px;\n\ttext-align: right;\n}\n*.instructionHeader {\n\tbackground-color: rgb(239,108,0);\n\tcolor: rgb(255,255,255);\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: bold;\n\tfont-size: 14.0px;\n\tline-height: 24.0px;\n\ttext-align: left;\n\tborder: 2.0px solid rgb(239,108,0);\n}\n*.instructionHeaderAlignment {\n\tpadding: 6.0px 0 6.0px 30.0px;\n\tborder: 2.0px solid rgb(239,108,0);\n}\n*.instructionTable {\n\tmargin-left: auto;\n\tmargin-right: auto;\n}\n*.instructionBox {\n\tbackground-color: rgb(255,255,255);\n\tborder: 2.0px solid rgb(239,108,0);\n\tfont-family: Arial , sans-serif;\n\tfont-size: 14.0px;\n\tfont-weight: 400;\n\tline-height: 24.0px;\n\tcolor: black;\n\twidth: 700.0px;\n\tpadding: 10.0px 25.0px 20.0px 30.0px;\n}\n*.salutationSubject {\n\tcolor: rgb(5,157,141);\n\tmargin-left: 30.0px;\n\tfont-size: 16.0px;\n\tfont-weight: 700;\n}\n*.row {\n\tdisplay: block;\n}\n*.timeCell {\n\ttext-align: left;\n\tpadding-top: 10.0px;\n\tpadding-bottom: 10.0px;\n\twidth: 26.0%;\n\tfont-size: 15.0px;\n\tline-height: 24.0px;\n}\n*.timeCellSpaceBetween {\n\ttext-align: left;\n\tpadding: 10.0px;\n\twidth: 20.0%;\n\tfont-size: 16.0px;\n\tline-height: 24.0px;\n}\n*.dateCell {\n\ttext-align: left;\n\tborder-right: 1.0px solid rgb(0,0,0);\n}\n*.selectedSlotHeader {\n\tbackground-color: rgb(232,232,232);\n\ttext-align: left;\n\tmargin: auto;\n\theight: 45.0px;\n\tfont-size: 16.0px;\n\tline-height: 24.0px;\n}\n*.emailContent {\n\tbackground-color: rgb(245,245,245);\n\tpadding: 0 30.0px 10.0px 30.0px;\n}\n*.scheduleButton {\n\twidth: 208.0px;\n\theight: 40.0px;\n\tmargin: 0.0px;\n\tvertical-align: middle;\n}\n*.scheduleButton a {\n\ttext-decoration: none;\n}\n*.scheduleButtonNoMargin {\n\twidth: 208.0px;\n\theight: 40.0px;\n\tvertical-align: middle;\n}\n*.scheduleButtonNoMargin a {\n\ttext-decoration: none;\n}\n*.scheduleButtonLink {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: bold;\n\tfont-size: 16.0px;\n\tline-height: normal;\n\ttext-align: center;\n\tcolor: rgb(255,255,255);\n\tdisplay: block;\n}\n*.inviteLink {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: bold;\n\tline-height: 18.0px;\n\tfont-size: 14.0px;\n\tfont-weight: 700;\n\tcolor: rgb(0,0,0);\n\ttext-decoration: none;\n}\n*.paraText {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: 400;\n\tfont-size: 14.0px;\n\tline-height: 24.0px;\n\tcolor: rgb(0,0,0);\n}\n*.paraText16px {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: 700;\n\tfont-size: 16.0px;\n\tline-height: 24.0px;\n\tcolor: rgb(0,0,0);\n}\n*.whiteBoxParaText {\n\tpadding: 10.0px 30.0px 0.0px 0.0px;\n\ttext-align: justify;\n\tline-height: 1.6;\n}\n*.refBox {\n\tpadding: 0.0px 30.0px 0.0px 0.0px;\n\tmargin: 0 0 20.0px 0;\n}\n*.refBoxNoMargin {\n\tpadding: 0.0px 30.0px 0.0px 0.0px;\n\tmargin: 0;\n}\n*.timeSlotBox {\n\tbackground-color: white;\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: normal;\n}\n*.timeSlotHeader {\n\tbackground-color: rgb(232,232,232);\n}\n*.timeSlot {\n\tfont-family: Graphik;\n\tfont-style: normal;\n\tfont-weight: 600;\n\tfont-size: 16.0px;\n\tline-height: 36.0px;\n\tcolor: rgb(0,0,0);\n\ttext-align: center;\n}\n*.timeSlotCell {\n\tpadding: 10.0px 0 10.0px 0;\n\tborder-bottom: 1.0px solid rgb(245,245,245);\n}\n*.resourceDocumentBox {\n\tbackground-color: white;\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: normal;\n\tmargin-top: 20.0px;\n}\n*.resourceBoxTdTop {\n\tpadding: 20.0px 20.0px 30.0px 20.0px;\n}\n*.resourceBoxTd {\n\tpadding: 0.0px 20.0px 30.0px 20.0px;\n}\n*.resourceSectionTitle {\n\tfont-size: 19.0px;\n\tline-height: 24.0px;\n\tcolor: rgb(0,0,0);\n\tpadding-top: 20.0px;\n\tmargin-bottom: 0.0px;\n}\n*.resourceDocumentTitle {\n\tfont-size: 14.0px;\n\tfont-weight: 700;\n\tcolor: blue;\n}\n*.resourceDoucmentDate {\n\tfont-size: 14.0px;\n\tcolor: rgb(0,0,0);\n}\n*.resourceDocumentCont {\n\tfont-size: 14.0px;\n\tfont-weight: 600;\n\tcolor: blue;\n}\n*#templateFooter {\n\tbackground-color: rgb(255,255,255);\n\tborder-top: 1.0px solid rgb(255,255,255);\n}\n*.footerContent {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: normal;\n\tfont-size: 12.0px;\n\tline-height: 20.0px;\n\tcolor: rgb(0,0,0);\n}\n*.footerText {\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: normal;\n\tfont-size: 12.0px;\n\tline-height: 20.0px;\n\tcolor: rgb(0,0,0);\n\tmargin-top: 12.35px;\n}\n*.footerLink {\n\theight: 20.0px;\n\tfont-family: Arial;\n\tfont-style: normal;\n\tfont-weight: normal;\n\tfont-size: 12.0px;\n\tline-height: 20.0px;\n\tcolor: rgb(0,82,214);\n}\n*.calIcon {\n\twidth: 24.0px;\n\theight: 24.0px;\n\tbackground-repeat: no-repeat;\n\tbackground-position: right;\n\tmargin-right: 10.0px;\n}\n*.copyIcon {\n\twidth: 24.0px;\n\theight: 24.0px;\n}\n*.divIcal {\n\tmargin-top: 5.0px;\n\tmargin-bottom: 10.0px;\n}\n*#bootstrap-overrides-para p {\n\tmargin: 10.0px 0 10.0px 0;\n}\n/*]]>*/</style></head><body>\n\t\t<center>\n\t\t\t<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable"><tbody><tr></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0"></table><table border="0" cellpadding="0" cellspacing="0" id="templateContainer"><tbody><tr><td align="center" valign="top">\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t\t<table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateHeader"><tbody><tr><td></td><td align="center" valign="top" class="headerContent" style="padding:20px 30px 20px 30px">\n        <table class="headerContentTable"><tbody><tr><td style="width:29%">\n              <span style="font-family:'helvetica' , 'arial' , sans-serif;font-size:24px;color:#ffffff;font-weight:bold">${identity3.lastName}<span style="font-family:'helvetica' , 'arial' , sans-serif;font-size:5px;color:#ffffff;font-weight:100">®</span></span>\n            </td><td class="mask"></td><td style="text-align:center;width:39%">\n              <span class="headerTitle">Schedule an Interaction</span>\n            </td><td class="mask"></td><td style="width:29%"></td></tr></tbody></table>\n      </td><td></td></tr></tbody></table>\n\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t</td></tr><tr><td align="center" valign="top" class="emailContent">\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t<table class="templateBody" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td style="padding:20px 0 10px 0">\n\t\t<table border="0" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td>\n\t\t\t\t\t  <p style="display:inline"> Dear ${identity1.firstName}, </p>\n\t\t\t\t</td><td>\n\t\t\t\t\t\t\t<img style="display:inline;height:0" dfsrc="https://schedule.${identity3.lastName}.com/schedule/images/guJ-TErRVd-MTxlGI8N7jbyZN_lTCD4G4-5nnS6HLWi58FgnBQX2ZHctU6Fm32vkZNp87pq6jgh1aaUoeHMTxA2" />\n\t\t\t\t</td></tr><tr><td colspan="2">\n\t\t\t\t\t\t<div id="bootstrap-overrides-para">\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<p style="margin-bottom:10px">This is a final courtesy reminder regarding your request for a conference call\n\t\t\t\t\t\t\t\t\tabout Review of Document "Market Guide for Email Security 2022". Please be advised that the Schedule an Interaction hyperlink will expire within\n\t\t\t\t\t\t\t\t\tthe next business day. Click the hyperlink below to schedule your call.</p>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</td></tr></tbody></table>\n\t</td></tr><tr><td class="whiteBox">\n\t\t<table width="100%" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td></td><td class="scheduleButtonNoMargin" valign="middle" align="center" bgcolor="#0052D6">\n\t\t\t\t\t<a style="color:#ffffff !important" href="https://schedule.${identity3.lastName}.com/schedule/interaction/guJ-TErRVd-MTxlGI8N7jbyZN_lTCD4G4-5nnS6HLWjL7VW777QbexQBReLzHCCFTTcN9guBAg1XgagURJUeUQ2/#/" target="_blank" rel="nofollow noopener noreferrer"> Schedule Interaction</a>\n\t\t\t\t</td><td></td></tr></tbody></table>\n\t</td></tr><tr><td class="whiteBoxTopMargin10Px">\n\t\t<p style="margin:10px 0 10px 0" class="paratext">If you are unable to click on the "Schedule Interaction" button, please copy and paste the following link in the browser to schedule this interaction:</p>\n\t</td></tr><tr><td class="whiteBoxNoTopMargin">\n\t\t<p style="font-family:'arial';font-style:normal;font-weight:bold;line-height:18px;font-size:14px;font-weight:700;color:#000000;text-decoration:none;margin:5px 0 10px 0">https://schedule.${identity3.lastName}.com/schedule/interaction/guJ-TErRVd-MTxlGI8N7jbyZN_lTCD4G4-5nnS6HLWjL7VW777QbexQBReLzHCCFTTcN9guBAg1XgagURJUeUQ2/#/</p>\n\t</td></tr><tr><td class="whiteBoxNoTopMargin">\n\t\t<p class="paratext">\n\t\t\tAll information related to your request will be retained and available for future scheduling.\n\t\t\tPlease reply to this message if you require any additional support with this request.</p>\n\t</td></tr><tr><td class="whiteBoxDummyTdHeight10px"></td></tr><tr><td class="dummyTdHeight10px"></td></tr><tr><td class="refBox">\n\t\t<div style="margin:10px 0 10px 0">Reference # <strong>15334464</strong></div>\n\t\t<div>Regards,<br />\n\t\t\tDylan Wallace<br />\n\t\t\tSpecialist, RES<br />\n\t\t\tResearch Engagement Services<br />\n\t\t\t${identity3.lastName}\n\t\t</div>\n\t\t<div>\n\t\t\t<strong>${identity3.lastName} Research Engagement Services:</strong><br />\n\t\t\tAmericas:  +1 203 316 1200 <br />\n\t\t\tEMEA:  +44 1784 26 7770 <br />\n\t\t\tAPAC: +61 7 3243 1567 or 65 6771 3725 <br />\n\t\t\tJapan:  81 3 6430 1900\n\t\t</div>\n\t</td></tr></tbody></table>\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t</td></tr><tr><td align="center" valign="top">\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t\t<table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateFooter"><tbody><tr><td style="height:15px"></td></tr><tr><td style="border-top:1.11px solid #c3c3c3" width="100%"></td></tr><tr><td valign="top">\n        <p class="footerText">\n          ©2022 ${identity3.lastName}, Inc. and/or its Affiliates. All\n          Rights Reserved. ${identity3.lastName} is a registered trademark of ${identity3.lastName}, Inc. or\n          its affiliates.\n        </p>\n      </td></tr></tbody></table>\n\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t</td></tr></tbody></table>\n\t\t\t\t\t\t\n\t\t\t\t\t\n\t\t\t\t\n\t\t\t\t\n\t\t\t\n\t\t</center>\n\t</body></html>`
						}
					]
				}
			],
			_jsns: 'urn:zimbraMail'
		}
	},
	_jsns: 'urn:zimbraSoap'
};
