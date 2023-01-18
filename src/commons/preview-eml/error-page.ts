/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import productLogo from '../../assets/logo-product-grey.png';
import logo from '../../assets/zextras-logo-gray.png';

export const errorPage = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>${t('label.error', 'Error')}</title>
        <style>
            html, body, .container {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            body {
                background-color: #ffffff;
                color: #4d4d4d;
                font-size: 0.8125rem;
                font-family: Roboto, sans-serif;
            }
            .container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .mainTextWrapper {
                color: #2b73d2;
                font-weight: 900;
                font-size: 1.625rem;
                line-height: 1.5rem;
                margin-top: 1.875rem;
            }
            .errorWrapper {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin: 1.4375rem 0 0.625rem;
            }
            .line {
                height: 0.0625rem;
                width: 6.25rem;
                background-color: gray;
            }
            .errorCode {
                color: #4d4d4d;
                font-weight: 300;
                font-size: 0.875rem;
                line-height: 1.3125rem;
                padding: 0 3.125rem;
                text-transform: uppercase;
            }
            .customText {
                margin: 0 0.3125rem 0 0;
                color: #414141;
            }
            .needSupportText {
                color: #414141;
                font-size: 0.9375rem;
            }
            .poweredByZextras {
                display: flex;
                margin: 1.875rem 0 0 0;
            }
            .zextrasLogo {
                top: 0.1875rem;
                position: relative;
            }
            .productLogo {
                height: 4.6875rem;
                width: 35.25rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="productLogo" >
                <img src=${productLogo} width="564" height="75"/>
            </div>
            <div class="mainTextWrapper">
            ${t('messages.could_not_find_to_show', 'Sorry, we couldn’t find anything to show')}
            </div>
            <div class="errorWrapper">
                <div class="line"></div>
                <div class="errorCode"><p>${t(
									'messages.something_went_wrong',
									'SOMETHING WENT WRONG'
								)}</p></div>
                <div class="line"></div>
            </div>
            <p class="needSupportText">${t(
							'messages.check_and_try_again',
							'Please, check Carbonio and try again'
						)}</p>
            <div class="poweredByZextras">
                <p class="customText">${t('messages.powered_by', 'powered by')}</p>
                <div class="zextrasLogo">
                    <img src=${logo} height="10" width="63"/>
                </div>
            </div>
        </div>
    </body>
</html>`;
