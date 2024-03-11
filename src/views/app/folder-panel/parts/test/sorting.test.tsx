/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { within } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { AccountSettings, FOLDERS } from '@zextras/carbonio-shell-ui';
import { forEach, indexOf, noop, without } from 'lodash';
import { ResponseComposition, rest, RestContext, RestRequest } from 'msw';

import { getSetupServer } from '../../../../../carbonio-ui-commons/test/jest-setup';
import { createAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import {
	RestGenericRequest,
	RestGenericResponse
} from '../../../../../carbonio-ui-commons/test/mocks/network/msw/handlers';
import { generateSettings } from '../../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { SORTING_OPTIONS, SORTING_DIRECTION } from '../../../../../constants';
import { generateStore } from '../../../../../tests/generators/store';
import { SearchRequest } from '../../../../../types';
import { Breadcrumbs } from '../breadcrumbs';

const handleSearchRequest = async (
	req: RestRequest<RestGenericRequest>,
	res: ResponseComposition<RestGenericResponse>,
	ctx: RestContext
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
) => {
	if (!req) {
		return res(ctx.status(500, 'Empty request'));
	}
	return res(ctx.json({ Body: {}, Header: {} }));
};

function findStringsContainingRadiobutton(strings: Array<string>): Array<string> {
	const resultArray = [] as Array<string>;

	strings.forEach((string) => {
		// Extract the content inside the data-testid attribute
		const match = string.match(/data-testid="([^"]+)"/);

		// Check if the match exists and contains "radiobuttonon" or "radiobuttonoff"
		if (match && match[1].includes('RadioButtonOff')) {
			resultArray.push('RadioButtonOff');
		}
		if (match && match[1].includes('RadioButtonOn')) {
			resultArray.push('RadioButtonOn');
		}
	});

	return resultArray;
}
const sortingDropdown = 'sorting-dropdown';
const defaultProps = {
	folderId: FOLDERS.INBOX,
	folderPath: '',
	isSearchModule: false,
	isSelectModeOn: false,
	itemsCount: 0,
	setIsSelectModeOn: noop
};
const dropdownRegex = /dropdown-popper-list/i;
const listIconRegex = /icon: AzListOutline/i;
const sortingOptionsWithoutSize = without(Object.values(SORTING_OPTIONS), SORTING_OPTIONS.size);
describe('Sorting component', () => {
	test('the sorting component appears on the breadcrumbs component', async () => {
		// Generate the store
		const store = generateStore();

		setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
	});
	test('in a folder different from SENT, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded TO', async () => {
		// Generate the store
		const store = generateStore();
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();

		forEach(sortingOptionsWithoutSize, (option) => {
			const regexPattern = new RegExp(`sorting_dropdown.${option.label.toLowerCase()}`, 'i');
			if (option.label !== SORTING_OPTIONS.to.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(regexPattern)
				).toBeInTheDocument();
			else {
				const excludedOptionRegexPattern = new RegExp(
					`sorting_dropdown.${SORTING_OPTIONS.to.label}`,
					'i'
				);
				const dropdownElement = within(screen.getByTestId(dropdownRegex)).queryByText(
					excludedOptionRegexPattern
				);
				expect(dropdownElement).not.toBeInTheDocument();
			}
		});
	});
	test('in SENT folder, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded FROM', async () => {
		// Generate the store
		const store = generateStore();

		const props = {
			...defaultProps,
			folderId: FOLDERS.SENT
		};
		const { user } = setupTest(<Breadcrumbs {...props} />, { store });
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		forEach(sortingOptionsWithoutSize, (option) => {
			const regexPattern = new RegExp(`sorting_dropdown.${option.label.toLowerCase()}`, 'i');
			if (option.label !== SORTING_OPTIONS.from.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(regexPattern)
				).toBeInTheDocument();
			else {
				const excludedOptionRegexPattern = new RegExp(
					`sorting_dropdown.${SORTING_OPTIONS.from.value}`,
					'i'
				);
				const dropdownElement = within(screen.getByTestId(dropdownRegex)).queryByText(
					excludedOptionRegexPattern
				);
				expect(dropdownElement).not.toBeInTheDocument();
			}
		});
	});
	test('clicking on the sorting component icon when open will close the dropdown', async () => {
		// Generate the store
		const store = generateStore();

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		if (sortIcon) await user.click(sortIcon);
		expect(screen.queryByTestId(dropdownRegex)).not.toBeInTheDocument();
	});

	test('clicking on the sorting direction icon switches from name descending to name ascending order and back', async () => {
		getSetupServer().use(rest.post('/service/soap/SearchRequest', handleSearchRequest));
		const store = generateStore();
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		expect(ascendingOption).toBeInTheDocument();
		await user.click(ascendingOption);

		const descendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.descendingOrder/i
		);
		expect(descendingOption).toBeInTheDocument();
		await user.click(descendingOption);
		expect(descendingOption).toBeInTheDocument();
	});

	test.each`
		case  | folderId         | sortingOption
		${1}  | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.unread}
		${2}  | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.unread}
		${3}  | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.important}
		${4}  | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.important}
		${5}  | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.flagged}
		${6}  | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.flagged}
		${7}  | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.attachment}
		${8}  | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.attachment}
		${9}  | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.from}
		${10} | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.from}
		${11} | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.to}
		${12} | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.to}
		${13} | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.date}
		${14} | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.date}
		${15} | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.subject}
		${16} | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.subject}
		${17} | ${FOLDERS.INBOX} | ${SORTING_OPTIONS.size}
		${18} | ${FOLDERS.SENT}  | ${SORTING_OPTIONS.size}
	`(
		`(case #$case) selecting order by $sortingOption.label.$sortingDirection`,
		async ({ folderId, sortingOption }) => {
			const store = generateStore();
			const customSettings: Partial<AccountSettings> = {
				prefs: {
					zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${SORTING_DIRECTION.DESCENDING},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`
				}
			};
			const props = { ...defaultProps, folderId };
			const account = generateSettings(customSettings);
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(account);
			const { user } = setupTest(<Breadcrumbs {...props} />, { store });

			expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
			const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
			if (sortIcon) await user.click(sortIcon);
			expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
			const orderParameters = within(screen.getByTestId(dropdownRegex)).queryAllByTestId(
				/RadioButton/
			);
			const orderParametersArray = findStringsContainingRadiobutton(
				orderParameters.map((element) => element.outerHTML)
			);
			const buttonOnPosition = indexOf(orderParametersArray, 'RadioButtonOn');
			const msgSortingOptionsArray = Object.values(SORTING_OPTIONS).map((option) => option.value);
			const finalSortingOptionsArray =
				props.folderId === FOLDERS.SENT
					? without(msgSortingOptionsArray, SORTING_OPTIONS.from.value)
					: without(msgSortingOptionsArray, SORTING_OPTIONS.to.value);
			const orderParameter =
				sortingOption.value === SORTING_OPTIONS.size.value
					? SORTING_OPTIONS.date.value
					: sortingOption.value;
			const orderParameterPosition = finalSortingOptionsArray.indexOf(orderParameter);
			expect(orderParameterPosition).toBe(buttonOnPosition);
		}
	);
	test('if no sort order setting is detected for a folder, the setting should default to "DateDesc"', async () => {
		// Generate the store
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const props = {
			...defaultProps,
			folderId: FOLDERS.SENT
		};
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${SORTING_OPTIONS.subject.value}${SORTING_DIRECTION.DESCENDING},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const { user } = setupTest(<Breadcrumbs {...props} />, { store });
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		const orderParameters = within(screen.getByTestId(dropdownRegex)).queryAllByTestId(
			/RadioButton/
		);

		const orderParametersArray = findStringsContainingRadiobutton(
			orderParameters.map((element) => element.outerHTML)
		);
		const buttonOnPosition = indexOf(orderParametersArray, 'RadioButtonOn');
		const msgSortingOptionsArray = Object.values(SORTING_OPTIONS).map((option) => option.value);
		const finalSortingOptionsArray =
			props.folderId === FOLDERS.SENT
				? without(msgSortingOptionsArray, SORTING_OPTIONS.from.value)
				: without(msgSortingOptionsArray, SORTING_OPTIONS.to.value);
		const orderParameter = SORTING_OPTIONS.date.value;
		const orderParameterPosition = finalSortingOptionsArray.indexOf(orderParameter);
		expect(buttonOnPosition).toBe(orderParameterPosition);
	});

	test('clicking on the sorting direction icon makes a SearchRequest api call with correct parameters types, sortBy and query', async () => {
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.date;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		const expectedRequest: SearchRequest = {
			_jsns: 'urn:zimbraMail',
			sortBy: `${sortingOption.value}${SORTING_DIRECTION.ASCENDING}`,
			types: isMessageView ? 'message' : 'conversation',
			query: `inId:${JSON.stringify(folderId)}`,
			limit: 100,
			fetch: '0',
			fullConversation: 1,
			needExp: 0,
			recip: '0'
		};

		const interceptor = createAPIInterceptor<SearchRequest>('Search');
		await user.click(ascendingOption);
		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
	});
	test('clicking on the sorting direction icon makes a SearchRequest api call with correct parameters types, sortBy and query', async () => {
		getSetupServer().use(rest.post('/service/soap/SearchRequest', handleSearchRequest));
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.date;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		const expectedRequest: SearchRequest = {
			_jsns: 'urn:zimbraMail',
			sortBy: `${sortingOption.value}${SORTING_DIRECTION.ASCENDING}`,
			types: isMessageView ? 'message' : 'conversation',
			query: `inId:${JSON.stringify(folderId)}`,
			limit: 100,
			fetch: '0',
			fullConversation: 1,
			needExp: 0,
			recip: '0'
		};

		const interceptor = createAPIInterceptor<SearchRequest>('Search');
		await user.click(ascendingOption);
		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
	});
	test('clicking on the sorting direction icon will switch the order direction', async () => {
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.date;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		expect(ascendingOption).toBeInTheDocument();

		await user.click(ascendingOption);
		const descendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.descendingOrder/i
		);

		expect(descendingOption).toBeInTheDocument();
	});
	test('clicking on the sorting direction icon makes a SearchRequest api call with correct parameters types, sortBy and query', async () => {
		getSetupServer().use(rest.post('/service/soap/SearchRequest', handleSearchRequest));
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.date;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		const expectedRequest: SearchRequest = {
			_jsns: 'urn:zimbraMail',
			sortBy: `${sortingOption.value}${SORTING_DIRECTION.ASCENDING}`,
			types: isMessageView ? 'message' : 'conversation',
			query: `inId:${JSON.stringify(folderId)}`,
			limit: 100,
			fetch: '0',
			fullConversation: 1,
			needExp: 0,
			recip: '0'
		};

		const interceptor = createAPIInterceptor<SearchRequest>('Search');
		await user.click(ascendingOption);
		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
	});
	test('clicking on the sorting direction icon with unread sortype makes a SearchRequest api call with correct parameters', async () => {
		getSetupServer().use(rest.post('/service/soap/SearchRequest', handleSearchRequest));
		const store = generateStore();
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.unread;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			/sorting_dropdown\.ascendingOrder/i
		);
		const expectedRequest: SearchRequest = {
			_jsns: 'urn:zimbraMail',
			sortBy: `date${SORTING_DIRECTION.ASCENDING}`,
			types: isMessageView ? 'message' : 'conversation',
			query: `inId:${JSON.stringify(folderId)} is:unread`,
			limit: 100,
			fetch: '0',
			fullConversation: 1,
			needExp: 0,
			recip: '0'
		};

		const interceptor = createAPIInterceptor<SearchRequest>('Search');
		await user.click(ascendingOption);
		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
	});
});
