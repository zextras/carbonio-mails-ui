/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import MessageCondition from './create-filters-conditions/message';
import FromToCondition from './create-filters-conditions/from-to';
import SizeCondition from './create-filters-conditions/size';
import DateCondition from './create-filters-conditions/date';
import BodyCondition from './create-filters-conditions/body';
import AttachmentCondition from './create-filters-conditions/attachment';
import ReadReceiptCondition from './create-filters-conditions/read-receipt';
import AddressInCondition from './create-filters-conditions/address-in';
import CalendarCondition from './create-filters-conditions/calendar';
import SocialCondition from './create-filters-conditions/social';
import DefaultCondition from './create-filters-conditions/default';

type GetTestComponent = { name: string; index: number; test: any; t: TFunction };

export const getTestComponent = ({ name, index, test, t }: GetTestComponent): ReactElement => {
	switch (name) {
		case 'addressTest': {
			return (
				<FromToCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'bulkTest':
		case 'listTest':
		case 'flaggedTest':
		case 'conversationTest': {
			return (
				<MessageCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'sizeTest': {
			return (
				<SizeCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'dateTest': {
			return (
				<DateCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'bodyTest': {
			return (
				<BodyCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}

		case 'attachmentTest': {
			return (
				<AttachmentCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}

		case 'mimeHeaderTest': {
			return (
				<ReadReceiptCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'contactRankingTest':
		case 'meTest':
		case 'addressBookTest': {
			return (
				<AddressInCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
		case 'inviteTest': {
			return (
				<CalendarCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}

		case 'linkedinTest':
		case 'facebookTest':
		case 'twitterTest': {
			return (
				<SocialCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}

		default: {
			return (
				<DefaultCondition
					t={t}
					activeIndex={index}
					defaultValue={test}
					key={`tmp-filter-${name}-${new Date().valueOf()}`}
				/>
			);
		}
	}
};

export const findRowKey = ({ name, test }: { name: string; test: any }): string => {
	switch (name) {
		case 'bodyTest':
			return 'body';

		case 'addressTest':
		case 'headerTest':
			return test.header;

		case 'sizeTest':
			return 'size';

		case 'attachmentTest':
			return 'attachment';
		case 'bulkTest':
		case 'listTest':
		case 'flaggedTest':
		case 'conversationTest':
			return 'message';

		case 'dateTest':
			return 'date';

		case 'mimeHeaderTest':
			return 'read receipt';

		case 'addressBookTest':
		case 'contactRankingTest':
		case 'meTest':
			return 'address in';

		case 'inviteTest':
			return 'calendar';

		case 'linkedinTest':
		case 'facebookTest':
		case 'twitterTest':
			return 'social';

		default:
			return 'subject';
	}
};
