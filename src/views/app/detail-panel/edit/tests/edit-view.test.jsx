/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React from 'react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { ActionsType } from '../../../../../commons/utils';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import { generateStore } from '../../../../../tests/generators/store';
import EditView from '../edit-view';

describe('Edit view', () => {
	test('create a new email', async () => {
		const store = generateStore();

		const props = {
			mailId: '',
			folderId: FOLDERS.INBOX,
			setHeader: noop,
			toggleAppBoard: false
		};

		jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param, defaultValue) => {
			if (param === 'action') {
				return 'new';
			}

			return undefined;
		});

		setupTest(<EditView {...props} />, { store });
	});
});
