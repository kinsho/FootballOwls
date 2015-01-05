from peewee import *;

# Global database constants

DATABASE_HOST = 'localhost';
DATABASE_PORT = 3306;
DATABASE_NAME = 'owlStakes';
DATABASE_USER_NAME = 'root';
DATABASE_PASSWORD = 'root';

# Global database connection

connection = MySQLDatabase(DATABASE_NAME, user = DATABASE_USER_NAME, passwd = DATABASE_PASSWORD, host = DATABASE_HOST, port = DATABASE_PORT); # Database connection
connection.connect();

# Class is responsible for serving as the base model for MySQL transactions
#
# @author kinsho
#
class BaseModel(Model):

	# Database Connection

	class Meta:
		database = connection;