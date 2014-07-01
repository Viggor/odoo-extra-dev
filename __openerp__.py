# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2012-2013 Elanz (<http://www.openelanz.fr>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'e3z POS enhanced for Apollo',
    'version': '1.0',
    'category': 'Tools',
    'description': """
""",
    'author': 'Elanz Centre',
    'website': 'http://www.openelanz.com',
    'summary': 'Pos enhancement',
    'depends': ['base', 'sale', 'point_of_sale',
    ],
    'data': [
        'pos_order_view.xml',
    ],
    'js': [
        'static/src/js/pos_apollo2.js',
        'static/src/js/main.js',
    ],
    'css': [
        'static/src/css/pos_apollo.css',
        'static/src/css/pos_apollo.css',
    ],
    'qweb': [
        'static/src/xml/pos_apollo.xml',
    ],
    'images': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
