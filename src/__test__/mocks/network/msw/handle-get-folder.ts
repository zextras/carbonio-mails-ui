/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ErrorSoapResponse, SoapHeader } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { HttpResponse, HttpResponseResolver } from 'msw';

import { BaseFolder, FolderView } from '../../../../types/folder';
import { generateSoapRoot } from '../../folders/soap-roots-generator';
import { getRandomFolderFlags } from '../../utils/folder';
import { getMocksContext } from '../../utils/mocks-context';

// todo: create getFolder return type
type Response = { Header: any; Body: any };

const _id = faker.number.int({ min: 1, max: 99999 });
const isSystemFolder = (): boolean => _id > 0 && _id <= 20;
const name = faker.word.noun();
const _view = 'appointment';

const defaultFolder = {
	id: `${_id}`,
	uuid: faker.string.uuid(),
	deletable: !isSystemFolder,
	name,
	isLink: false,
	depth: 1,
	folder: [],
	recursive: false,
	absFolderPath: `/${name}`,
	l: '1',
	luuid: faker.string.uuid(),
	f: getRandomFolderFlags(_view),
	view: _view,
	rev: faker.number.int({ min: 1, max: 99999 }),
	ms: faker.number.int({ min: 1, max: 99999 }),
	webOfflineSyncDays: 0,
	activesyncdisabled: false,
	n: 1,
	s: 0,
	i4ms: faker.number.int({ min: 1, max: 99999 }),
	i4next: faker.number.int({ min: 1, max: 99999 })
} as BaseFolder;

const defaultFolders = [defaultFolder];
const defaultSuccessfulBody = {
	GetFolderResponse: {
		folder: defaultFolders,
		_jsns: 'urn:zimbraMail'
	}
};

const getDefaultFolderById = (id: string): BaseFolder => ({
	...defaultFolder,
	id
});

const getSuccessfulBodyByView = (
	view: FolderView,
	tr?: number,
	context?: any
): Response['Body'] => {
	const identity = getMocksContext().identities.primary.identity.email;
	const account = context.account._content;
	const luuid = context.session.id;
	const isPrimaryAccount = identity === account;
	if (tr) {
		const tree = generateSoapRoot(true, isPrimaryAccount, luuid);
		const filteredByView = {
			...tree,
			folder: filter(tree.folder, ['view', view]),
			link: filter(tree.link, ['view', view])
		};
		return {
			...defaultSuccessfulBody,
			GetFolderResponse: {
				...defaultSuccessfulBody.GetFolderResponse,
				folder: [filteredByView]
			}
		};
	}
	const tree = generateSoapRoot(false, isPrimaryAccount, luuid);
	const filteredByView = {
		...tree,
		folder: filter(tree.folder, ['view', view]),
		link: filter(tree.link, ['view', view])
	};
	return {
		...defaultSuccessfulBody,
		GetFolderResponse: {
			...defaultSuccessfulBody.GetFolderResponse,
			folder: [filteredByView]
		}
	};
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getSuccessfulBody = (tr?: number, context: any): Response['Body'] => {
	const identity = getMocksContext().identities.primary.identity.email;
	const account = context.account._content;
	const luuid = context.session.id;
	const isPrimaryAccount = identity === account;

	const tree = generateSoapRoot(!!tr, isPrimaryAccount, luuid);
	return {
		GetFolderResponse: {
			folder: [tree],
			_jsns: 'urn:zimbraMail'
		}
	};
};

// todo: update return type once soap return type is created
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getSuccessfulBodyById = (id: string, tr?: number, context: any): Response['Body'] => {
	if (id === '1' && tr) {
		return getSuccessfulBody(tr, context);
	}
	return {
		...defaultSuccessfulBody,
		GetFolderResponse: {
			...defaultSuccessfulBody.GetFolderResponse,
			folder: [getDefaultFolderById(id)]
		}
	};
};

const getDefaultGetFolderResponse = (
	{ view, id, tr, context } = {} as {
		id?: string;
		view?: FolderView;
		tr?: number;
		context?: boolean;
	}
): Response['Body'] => {
	if (view) {
		return getSuccessfulBodyByView(view, tr, context);
	}
	if (id) {
		return getSuccessfulBodyById(id, tr, context);
	}
	return getSuccessfulBody(tr, context);
};

const getFolderResponse = (
	{ id, view, tr, context } = {} as {
		id?: string;
		view?: FolderView;
		tr?: number;
		context?: any;
	}
): Response => ({
	Header: {
		context: {
			session: {
				id: faker.number.int({ min: 1, max: 999999 }),
				_content: faker.number.int({ min: 1, max: 999999 })
			}
		}
	},
	Body: getDefaultGetFolderResponse({ id, view, tr, context })
});

export const handleGetFolderRequest: HttpResponseResolver<
	never,
	{
		Body: { GetFolderRequest: { id?: string; view?: FolderView; tr?: number; context?: any } };
		Header: SoapHeader;
	}
> = async ({ request }) => {
	const requestContent = await request.json();
	const { view, id, tr } = requestContent.Body.GetFolderRequest;
	const { context } = requestContent.Header;
	const response = getFolderResponse({ view, id, tr, context });
	return HttpResponse.json(response);
};

export const handleFailedRequest: HttpResponseResolver<never, ErrorSoapResponse> = async () =>
	HttpResponse.json({}, { type: 'error', status: 500, statusText: 'Failed' });
