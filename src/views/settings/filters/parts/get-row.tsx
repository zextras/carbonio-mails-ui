/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
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
import HeaderCondition from './create-filters-conditions/header';
import SocialCondition from './create-filters-conditions/social';
import DefaultCondition from './create-filters-conditions/default';
import { capitalise } from '../../../sidebar/utils';

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
						headerTest: [{ header: 'from', part: 'all', stringComparison: 'contains', value: '' }]
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
