/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import type { TFunction } from 'i18next';

import AddressInCondition from 'views/settings/filters/parts/create-filters-conditions/address-in';
import AttachmentCondition from 'views/settings/filters/parts/create-filters-conditions/attachment';
import BodyCondition from 'views/settings/filters/parts/create-filters-conditions/body';
import CalendarCondition from 'views/settings/filters/parts/create-filters-conditions/calendar';
import DateCondition from 'views/settings/filters/parts/create-filters-conditions/date';
import DefaultCondition from 'views/settings/filters/parts/create-filters-conditions/default';
import FromToCondition from 'views/settings/filters/parts/create-filters-conditions/from-to';
import HeaderCondition from 'views/settings/filters/parts/create-filters-conditions/header';
import MessageCondition from 'views/settings/filters/parts/create-filters-conditions/message';
import ReadReceiptCondition from 'views/settings/filters/parts/create-filters-conditions/read-receipt';
import SizeCondition from 'views/settings/filters/parts/create-filters-conditions/size';
import SocialCondition from 'views/settings/filters/parts/create-filters-conditions/social';
import { capitalise } from 'views/sidebar/utils';

type GetRowProps = {
	index: number;
	setNewFilters: (arg: any) => void;
	newFilters: Array<any>;
	t: TFunction;
	condition: string;
};
export const getRowFunc =
	({ index, setNewFilters, newFilters, t, condition }: GetRowProps): any =>
	(str: string): void => {
		let temp;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		let tests = [];
		const previousNewFilters = newFilters.slice();
		switch (str) {
			case 'from':
			case 'to':
			case 'cc':
			case 'to,cc': {
				temp = <FromToCondition t={t} activeIndex={index} />;
				tests = [
					{
						condition,
						addressTest: [{ header: 'from', part: 'all', stringComparison: 'contains', value: '' }]
					}
				];
				break;
			}
			case 'message': {
				temp = <MessageCondition t={t} activeIndex={index} />;
				tests = [
					{
						condition,
						conversationTest: [{ where: 'started' }]
					}
				];
				break;
			}
			case 'size': {
				temp = <SizeCondition t={t} activeIndex={index} />;
				tests = [{ condition, sizeTest: [{ numberComparison: 'under', s: '' }] }];
				break;
			}
			case 'date': {
				temp = <DateCondition t={t} activeIndex={index} />;
				tests = [{ condition, dateTest: [{ dateComparison: 'before', d: '' }] }];
				break;
			}
			case 'body': {
				temp = <BodyCondition t={t} activeIndex={index} />;
				tests = [{ condition, bodyTest: [{ value: '' }] }];
				break;
			}

			case 'attachment': {
				temp = <AttachmentCondition t={t} activeIndex={index} />;
				tests = [{ condition, attachmentTest: [{}] }];
				break;
			}

			case 'read receipt': {
				temp = <ReadReceiptCondition t={t} activeIndex={index} />;
				tests = [
					{
						condition,
						mimeHeaderTest: [
							{
								header: 'Content-Type',
								stringComparison: 'Contains',
								value: 'message/disposition-notification'
							}
						]
					}
				];
				break;
			}
			case 'address in': {
				temp = <AddressInCondition t={t} activeIndex={index} />;
				tests = [{ condition }];
				break;
			}
			case 'calendar': {
				temp = <CalendarCondition t={t} activeIndex={index} />;
				tests = [{ condition, inviteTest: [{ method: [{ _content: 'anyreply' }] }] }];
				break;
			}
			case 'header named': {
				temp = <HeaderCondition t={t} activeIndex={index} />;
				tests = [
					{
						condition,
						headerTest: [{ header: 'header', stringComparison: 'contains', value: '' }]
					}
				];
				break;
			}
			case 'social': {
				temp = <SocialCondition t={t} activeIndex={index} />;
				tests = [{ condition, linkedinTest: [{}] }];
				break;
			}
			default: {
				temp = <DefaultCondition t={t} activeIndex={index} />;
				tests = [
					{
						condition,
						headerTest: [{ header: 'subject', stringComparison: 'contains', value: '' }]
					}
				];
			}
		}
		previousNewFilters[index] = {
			...previousNewFilters[index],
			comp: temp,
			key: str,
			label: capitalise(str),
			index,
			filterTests: tests
		};
		setNewFilters(previousNewFilters);
	};
