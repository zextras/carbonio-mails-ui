/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { DefaultBodyType, http, HttpResponse, StrictRequest } from 'msw';

import { APIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

type MSWServer = { use: any };

export const stubApi = (
	server: MSWServer,
	method: 'get' | 'post',
	url: string,
	response: HttpResponse<DefaultBodyType>
): APIInterceptor => {
	let calledTimes = 0;
	const requests: Array<StrictRequest<DefaultBodyType>> = [];

	server.use(
		http[method](url, async ({ request }) => {
			calledTimes += 1;
			requests.push(request);
			return response;
		})
	);

	return {
		getLastRequest: () => requests[requests.length - 1],
		getCalledTimes: () => calledTimes
	};
};

type HandlerRequest<T> = DefaultBodyType & {
	Body: Record<string, T>;
};
export const stubSoapApi = <RequestParamsType, ResponseType = never>(
	server: MSWServer,
	apiAction: string,
	response?: ResponseType
): Promise<RequestParamsType> =>
	new Promise<RequestParamsType>((resolve, reject) => {
		server.use(
			http.post<never, HandlerRequest<RequestParamsType>>(
				`/service/soap/${apiAction}Request`,
				async ({ request }) => {
					if (!request) {
						reject(new Error('Empty request'));
						return HttpResponse.json(
							{},
							{
								status: 500,
								statusText: 'Empty request'
							}
						);
					}

					const reqActionParamWrapper = `${apiAction}Request`;
					const requestContent = await request.json();
					const params = requestContent?.Body?.[reqActionParamWrapper];
					resolve(params);

					return HttpResponse.json({
						Body: {
							[`${apiAction}Response`]: response ?? {}
						}
					});
				}
			)
		);
	});
