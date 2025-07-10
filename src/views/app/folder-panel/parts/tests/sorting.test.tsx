/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook, within } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { AccountSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { forEach, indexOf, noop, without } from 'lodash';

import { screen, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { SORTING_DIRECTION, SORTING_OPTIONS } from 'constants/index';
import { setMessagesInEmailStore, useMessageIndexSlice } from 'store/emails/store';
import { generateMessage } from 'tests/generators/generateMessage';
import { SearchRequest } from 'types/index.d';
import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';

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
	it('the sorting component appears on the breadcrumbs component', async () => {
		// Generate the store

		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
	});
	it('in a folder different from SENT, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded TO', async () => {
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();

		forEach(sortingOptionsWithoutSize, (option) => {
			if (option.label !== SORTING_OPTIONS.to.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(option.label.toLowerCase())
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
	it('in SENT folder, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded FROM', async () => {
		const props = {
			...defaultProps,
			folderId: FOLDERS.SENT
		};
		const { user } = setupTest(<Breadcrumbs {...props} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		forEach(sortingOptionsWithoutSize, (option) => {
			if (option.label !== SORTING_OPTIONS.from.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(option.label.toLowerCase())
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
	it('clicking on the sorting component icon when open will close the dropdown', async () => {
		// Generate the store

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		if (sortIcon) await user.click(sortIcon);
		expect(screen.queryByTestId(dropdownRegex)).not.toBeInTheDocument();
	});

	it('clicking on the sorting direction icon switches from name descending to name ascending order and back', async () => {
		createSoapAPIInterceptor('Search');

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText('Ascending order');
		expect(ascendingOption).toBeInTheDocument();
		await user.click(ascendingOption);

		const descendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			'Descending order'
		);
		expect(descendingOption).toBeInTheDocument();
		await user.click(descendingOption);
		expect(descendingOption).toBeInTheDocument();
	});

	// it('if no sort order setting is detected for a folder, the setting should default to "DateDesc"', async () => {
	// 	const folderId = FOLDERS.INBOX;
	// 	const props = {
	// 		...defaultProps,
	// 		folderId: FOLDERS.SENT
	// 	};
	// 	const customSettings: Partial<AccountSettings> = {
	// 		prefs: {
	// 			zimbraPrefSortOrder: `${folderId}:${SORTING_OPTIONS.subject.value}${SORTING_DIRECTION.DESCENDING},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`,
	// 			zimbraPrefGroupMailBy: 'message'
	// 		}
	// 	};
	// 	const settings = generateSettings(customSettings);

	// 	jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

	// 	const { user } = setupTest(<Breadcrumbs {...props} />);
	// 	const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
	// 	if (sortIcon) await user.click(sortIcon);
	// 	const orderParameters = within(screen.getByTestId(dropdownRegex)).queryAllByTestId(
	// 		/RadioButton/
	// 	);

	// 	const orderParametersArray = findStringsContainingRadiobutton(
	// 		orderParameters.map((element) => element.outerHTML)
	// 	);
	// 	const buttonOnPosition = indexOf(orderParametersArray, 'RadioButtonOn');
	// 	const msgSortingOptionsArray = Object.values(SORTING_OPTIONS).map((option) => option.value);
	// 	const finalSortingOptionsArray =
	// 		props.folderId === FOLDERS.SENT
	// 			? without(msgSortingOptionsArray, SORTING_OPTIONS.from.value)
	// 			: without(msgSortingOptionsArray, SORTING_OPTIONS.to.value);
	// 	const orderParameter = SORTING_OPTIONS.date.value;
	// 	const orderParameterPosition = finalSortingOptionsArray.indexOf(orderParameter);
	// 	expect(buttonOnPosition).toBe(orderParameterPosition);
	// });

	it('clicking on the sorting direction icon reverses the messages order', async () => {
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
		const message1 = generateMessage({ id: '1' });
		const message2 = generateMessage({ id: '2' });
		setMessagesInEmailStore([message1, message2], false);
		const { result: initialOrder } = renderHook(() => useMessageIndexSlice());
		expect(initialOrder.current.messageListIndex).toEqual(['1', '2']);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const isMessageView = settings.prefs.zimbraPrefGroupMailBy === 'message';
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView });
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText('Ascending order');
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

		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		user.click(ascendingOption);

		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
		const { result: newOrder } = renderHook(() => useMessageIndexSlice());
		await act(async () => {
			expect(newOrder.current.messageListIndex).toEqual(['1', '2']);
		});
	});

	it('clicking on the sorting direction icon will switch the order direction', async () => {
		createSoapAPIInterceptor('Search');
		const folderId = FOLDERS.INBOX;
		const sortingOption = SORTING_OPTIONS.date;
		const sortingDirection = SORTING_DIRECTION.DESCENDING;
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingOption.value}${sortingDirection},BDLV:,CAL:,CLV:,CLV-SR-1:dateDesc,CLV-SR-2:dateDesc,CLV-main:dateDesc,CNS:,CNSRC:,CNTGT:,CV:,TKL:,TKL-main:taskDueAsc,TV:,TV-main:dateDesc`
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText('Ascending order');
		expect(ascendingOption).toBeInTheDocument();

		await user.click(ascendingOption);
		const descendingOption = within(screen.getByTestId(dropdownRegex)).getByText(
			'Descending order'
		);

		expect(descendingOption).toBeInTheDocument();
	});
	it('clicking on the sorting direction icon with unread sortype makes a SearchRequest api call with correct parameters', async () => {
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

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		const ascendingOption = within(screen.getByTestId(dropdownRegex)).getByText('Ascending order');
		const expectedRequest: SearchRequest = {
			_jsns: 'urn:zimbraMail',
			sortBy: `date${SORTING_DIRECTION.ASCENDING}`,
			types: isMessageView ? 'message' : 'conversation',
			query: `inId:${JSON.stringify(folderId)}`,
			limit: 100,
			fetch: '0',
			fullConversation: 1,
			needExp: 0,
			recip: '0'
		};

		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		await user.click(ascendingOption);
		const req = await interceptor;
		expect(req.sortBy).toBe(expectedRequest.sortBy);
		expect(req.types).toBe(expectedRequest.types);
		expect(req.query).toBe(expectedRequest.query);
	});

	it('uses correct query string from getFilterQuery when a filter is selected', async () => {
		const folderId = FOLDERS.INBOX;
		const expectedQuery = `inId:"${folderId}" is:unread`;

		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView: true });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();

		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		await user.click(sortIcon);

		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();

		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');

		const unreadOption = within(screen.getByTestId(dropdownRegex)).getByText('unread');
		await user.click(unreadOption);

		const req = await interceptor;
		expect(req.query).toBe(expectedQuery);
	});

	it('reset button clears filters and resets sorting state', async () => {
		const folderId = FOLDERS.INBOX;
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:subjectDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView: true });

		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		await user.click(sortIcon);

		const unreadOption = within(screen.getByTestId(dropdownRegex)).getByText('unread');
		await user.click(unreadOption);

		const resetButton = await screen.findByRole('button', { name: /reset/i });
		await user.click(resetButton);

		const req = await interceptor;
		expect(req.sortBy).toBe(`dateDesc`);
	});

	it('selecting a filter triggers performSearch with correct query', async () => {
		const folderId = FOLDERS.INBOX;
		const interceptor = createSoapAPIInterceptor<SearchRequest>('Search');
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:dateDesc`,
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const settings = generateSettings(customSettings);

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		jest.spyOn(hooks, 'useAppContext').mockReturnValue({ isMessageView: true });

		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);

		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		await user.click(sortIcon);

		const unreadOption = within(screen.getByTestId(dropdownRegex)).getByText('unread');
		await user.click(unreadOption);

		const req = await interceptor;
		expect(req.query).toBe(`inId:"${folderId}" is:unread`);
		expect(req.sortBy).toBe('dateDesc');
	});
});
