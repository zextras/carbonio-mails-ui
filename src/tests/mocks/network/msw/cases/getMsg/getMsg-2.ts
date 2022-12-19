/*
 * SPDX-FileCopyrightText: 2021 company <https://www.foo.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 6 inline attachments with cid not in the body
export const getMsgResult = {
	Header: {
		context: {
			session: { id: '165483', _content: '165483' },
			change: { token: 15977 },
			_jsns: 'urn:zimbra'
		}
	},
	Body: {
		GetMsgResponse: {
			m: [
				{
					s: 496599,
					d: 1667972749000,
					l: '2',
					cid: '25936',
					f: 'a',
					rev: 95254,
					id: '26108',
					fr: 'Kind Regards Ciccio Pasticcio From: "FAD - Ufficio Formazione Pre.Lab S.r.l." - "bepi@foo.com" To: "Ciccio Pasticcio" - ...',
					su: 'Fwd: Iscrizione ai corsi: formazione generale lavoratori e specifica comparto uffici, 4+4 ore - sig. Pasticcio',
					mid: '<816584378.24434091.1667972748382.JavaMail.company@foo.com>',
					sd: 1667972748000,
					cm: true,
					e: [
						{
							a: 'ciccio@foo.com',
							d: 'ciccio',
							p: 'Ciccio Pasticcio',
							t: 'f'
						},
						{
							a: 'ciccio@foo.com',
							d: 'ciccio',
							p: 'Ciccio Pasticcio',
							t: 't'
						}
					],
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/mixed',
							mp: [
								{
									part: '1',
									ct: 'multipart/alternative',
									mp: [
										{
											part: '1.1',
											ct: 'text/plain',
											s: 572
										},
										{
											part: '1.2',
											ct: 'multipart/related',
											mp: [
												{
													part: '1.2.1',
													ct: 'text/html',
													s: 7557,
													body: true,
													content:
														'<html><body><div><br /></div><div><img src="cid:bdbdae48-81e8-4817-ba12-4794fa5fe5c2" id="26105_null" /><br /></div><div><br /></div><div id="c_mobile_signature_container"><div><div><br /></div><div>Kind Regards <br /></div><div><br /></div><div>Ciccio Pasticcio<br /></div></div></div><div><br /></div><div><hr id="zwchr" /><br /></div><div><div><b>From:</b> &#34;FAD - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;fad&#64;foo.com&#34; <br /></div><div><b>To:</b> &#34;Ciccio Pasticcio&#34; - &#34;ciccio.pasticcio&#64;foo.com&#34; <br /></div><div><b>Cc:</b> &#34;Martina Rota - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;formazione&#64;foo.com&#34;, &#34;Elena Pievani - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;resp.formazione&#64;foo.com&#34;, &#34;Rossi Elena - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;formazione6&#64;foo.com&#34; <br /></div><div><b>Sent:</b> Thursday, July 7, 2022, 16:06<br /></div><div><b>Subject:</b> Iscrizione ai corsi: formazione generale lavoratori e specifica comparto uffici, 4&#43;4 ore - sig. Pasticcio<br /></div></div><div><br /></div><div><div style="font-family:&#39;calibri&#39; , &#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:rgb( 0 , 0 , 0 )" class="elementToProof"><span style="color:black"><span class="font" style="font-family:&#39;calibri&#39; , sans-serif"><span class="size" style="font-size:11pt">Gentile sig. Pasticcio,</span></span></span> <br /></div><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></body></html>'
												},
												{
													part: '1.2.2',
													ct: 'image/jpeg',
													s: 87247,
													cd: 'inline',
													filename: 'PXL_20220830_095536184.jpg',
													ci: '<bdbdae48-81e8-4817-ba12-4794fa5fe5c2>'
												}
											]
										}
									]
								},
								{
									part: '2',
									ct: 'image/jpeg',
									s: 266326,
									cd: 'attachment',
									filename: 'Screenshot_20221003-182644.png'
								}
							]
						}
					],
					sf: ''
				},
				{
					s: 494662,
					d: 1667972748000,
					l: '5',
					cid: '25936',
					f: 'sa',
					rev: 95250,
					id: '26107',
					fr: 'Kind Regards Ciccio Pasticcio From: "FAD - Ufficio Formazione Pre.Lab S.r.l." - "bepi@foo.com" To: "Ciccio Pasticcio" - ...',
					e: [
						{
							a: 'ciccio@foo.com',
							d: 'ciccio',
							p: 'Ciccio Pasticcio',
							t: 'f'
						},
						{
							a: 'ciccio@foo.com',
							d: 'ciccio',
							p: 'Ciccio Pasticcio',
							t: 't'
						}
					],
					su: 'Fwd: Iscrizione ai corsi: formazione generale lavoratori e specifica comparto uffici, 4+4 ore - sig. Pasticcio',
					mid: '<816584378.24434091.1667972748382.JavaMail.company@foo.com>',
					sd: 1667972748000,
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/mixed',
							mp: [
								{
									part: '1',
									ct: 'multipart/alternative',
									mp: [
										{
											part: '1.1',
											ct: 'text/plain',
											s: 572
										},
										{
											part: '1.2',
											ct: 'multipart/related',
											mp: [
												{
													part: '1.2.1',
													ct: 'text/html',
													s: 7557,
													body: true,
													content:
														'<html><body><div><br /></div><div><img src="cid:bdbdae48-81e8-4817-ba12-4794fa5fe5c2" id="26105_null" /><br /></div><div><br /></div><div id="c_mobile_signature_container"><div><div><br /></div><div>Kind Regards <br /></div><div><br /></div><div>Ciccio Pasticcio<br /></div></div></div><div><br /></div><div><hr id="zwchr" /><br /></div><div><div><b>From:</b> &#34;FAD - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;fad&#64;foo.com&#34; <br /></div><div><b>To:</b> &#34;Ciccio Pasticcio&#34; - &#34;ciccio.pasticcio&#64;foo.com&#34; <br /></div><div><b>Cc:</b> &#34;Martina Rota - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;formazione&#64;foo.com&#34;, &#34;Elena Pievani - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;resp.formazione&#64;foo.com&#34;, &#34;Rossi Elena - Ufficio Formazione Pre.Lab S.r.l.&#34; - &#34;formazione6&#64;foo.com&#34; <br /></div><div><b>Sent:</b> Thursday, July 7, 2022, 16:06<br /></div><div><b>Subject:</b> Iscrizione ai corsi: formazione generale lavoratori e specifica comparto uffici, 4&#43;4 ore - sig. Pasticcio<br /></div></div><div><br /></div><div><div style="font-family:&#39;calibri&#39; , &#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:rgb( 0 , 0 , 0 )" class="elementToProof"><span style="color:black"><span class="font" style="font-family:&#39;calibri&#39; , sans-serif"><span class="size" style="font-size:11pt">Gentile sig. Pasticcio,</span></span></span> <br /></div><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"><div dir="ltr"></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></body></html>'
												},
												{
													part: '1.2.2',
													ct: 'image/jpeg',
													s: 87247,
													cd: 'inline',
													filename: 'PXL_20220830_095536184.jpg',
													ci: '<bdbdae48-81e8-4817-ba12-4794fa5fe5c2>'
												}
											]
										}
									]
								},
								{
									part: '2',
									ct: 'image/jpeg',
									s: 266326,
									cd: 'attachment',
									filename: 'Screenshot_20221003-182644.png'
								}
							]
						}
					]
				},
				{
					s: 301120,
					d: 1657202815000,
					l: '2',
					cid: '25936',
					f: 'awf',
					tn: 'TEST555',
					t: '21334',
					rev: 82737,
					id: '19859',
					fr: 'Gentile sig. Pasticcio, Con la presente siamo a comunicarle le credenziali e le istruzioni per poter accedere in qualità di “studente” alla ...',
					su: 'Iscrizione ai corsi: formazione generale lavoratori e specifica comparto uffici, 4+4 ore - sig. Pasticcio',
					mid: '<VI1PR01MB395255BFB03D3DFF62E27979A2839@VI1PR01MB3952.eurprd01.prod.exchangelabs.com>',
					sd: 1657202803000,
					cm: true,
					e: [
						{
							a: 'bepi@foo.com',
							d: 'FAD',
							p: 'FAD - Ufficio Formazione Pre.Lab S.r.l.',
							t: 'f'
						},
						{
							a: 'ciccio@foo.com',
							d: 'ciccio',
							p: 'Ciccio Pasticcio',
							t: 't'
						},
						{
							a: 'formazione@foo.com',
							d: 'Martina',
							p: 'Martina Rota - Ufficio Formazione Pre.Lab S.r.l.',
							t: 'c'
						},
						{
							a: 'resp.formazione@foo.com',
							d: 'Elena',
							p: 'Elena Pievani - Ufficio Formazione Pre.Lab S.r.l.',
							t: 'c'
						},
						{
							a: 'formazione6@foo.com',
							d: 'Rossi',
							p: 'Rossi Elena - Ufficio Formazione Pre.Lab S.r.l.',
							t: 'c'
						}
					],
					mp: [
						{
							part: 'TEXT',
							ct: 'multipart/related',
							mp: [
								{
									part: '1',
									ct: 'multipart/alternative',
									mp: [
										{
											part: '1.1',
											ct: 'text/plain',
											s: 2700
										},
										{
											part: '1.2',
											ct: 'text/html',
											s: 255111,
											body: true,
											content:
												'<html><head><style style="display:none">/*<![CDATA[*/P {\n\tmargin-top: 0;\n\tmargin-bottom: 0;\n}\n/*]]>*/</style></head><body dir="ltr">\r\n<div style="font-family:&#39;calibri&#39; , &#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:rgb( 0 , 0 , 0 )" class="elementToProof">\r\n<span style="color:black;font-family:&#39;calibri&#39; , sans-serif;font-size:11pt">Gentile sig. Pasticcio,</span><br />\r\n</div>\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n<div dir="ltr">\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div>\r\n</div></body></html>\r\n'
										}
									]
								},
								{
									part: '2',
									ct: 'image/jpeg',
									s: 7056,
									cd: 'inline',
									filename: 'Outlook-1x1g1hrl.jpg',
									ci: '<d3f1a3d8-d183-4bc6-b7e7-9dc18b221822>'
								},
								{
									part: '3',
									ct: 'image/jpeg',
									s: 2139,
									cd: 'inline',
									filename: 'Outlook-ilsh22rk.jpg',
									ci: '<672c7645-7578-497e-83a4-e12430643c07>'
								},
								{
									part: '4',
									ct: 'image/jpeg',
									s: 2778,
									cd: 'inline',
									filename: 'Outlook-wzehgcke.jpg',
									ci: '<73fa1971-16b3-4a44-81d5-eef617271c72>'
								},
								{
									part: '5',
									ct: 'image/png',
									s: 1134,
									cd: 'inline',
									filename: 'Outlook-qyhk2jqr.png',
									ci: '<14709f65-f185-4d40-9d70-31a34fab14d5>'
								},
								{
									part: '6',
									ct: 'image/png',
									s: 1176,
									cd: 'inline',
									filename: 'Outlook-3ypg122c.png',
									ci: '<220ff923-3fc3-468f-b9ff-410fd2f0a3d0>'
								},
								{
									part: '7',
									ct: 'image/png',
									s: 2706,
									cd: 'inline',
									filename: 'Outlook-s3qk5vmt.png',
									ci: '<d6b2fc7d-e736-409d-8645-8598b5cb8720>'
								}
							]
						}
					],
					sf: ''
				}
			],
			more: false,
			_jsns: 'urn:zimbraMail'
		},
		_jsns: 'urn:zimbraSoap'
	}
};
