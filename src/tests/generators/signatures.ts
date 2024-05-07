/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import type { SignItemType } from '../../types';

export const buildSignature = ({
	id = faker.string.uuid(),
	name = faker.word.noun(1),
	content = [
		{
			type: 'text/html',
			_content: faker.word.preposition()
		}
	]
}: Partial<SignItemType> = {}): SignItemType => ({
	id,
	name,
	label: name,
	description: content[0]._content,
	content
});
