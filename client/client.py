from requests.exceptions import ConnectionError
from socketIO_client import SocketIO

def on_connect():
    print 'connect'

def on_new_response(*args):
    print args
	
try:
    socket = SocketIO('127.0.0.1', 5000, wait_for_connection=False)
    socket.on('connect', on_connect)
    socket.on('new_scan', on_new_response)
    socket.wait()
except ConnectionError:
    print('The server is down. Try again later.')
